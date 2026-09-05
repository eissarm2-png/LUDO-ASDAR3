import { createHmac, randomInt, timingSafeEqual } from "crypto";

/** التوقيع الرقمي للنتائج التي يولّدها السيرفر (نرد/مؤقت) */
export function signPayload(parts: (string | number)[]): string {
  const secret = process.env["ABQOR_MATCH_SECRET"] ?? "";
  return createHmac("sha256", secret).update(parts.join("|")).digest("hex").slice(0, 32);
}

/** تحقق ثابت الزمن من توقيع السيرفر */
export function verifyPayload(parts: (string | number)[], sig: string): boolean {
  const expected = signPayload(parts);
  const a = Buffer.from(expected);
  const b = Buffer.from(String(sig ?? ""));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** نرد عشوائي آمن مولّد داخل السيرفر */
export function secureDie(): number {
  return randomInt(1, 7);
}

export const TURN_LIMIT_MS = 15_000;

/** هامش سماح لتأخر الشبكة عند إنهاء الدور */
export const FORFEIT_GRACE_MS = 750;

/**
 * تسجيل حدث زمني للدور (بداية/رمية/إنهاء) بهوية اللاعب المسجّل.
 * يُستخدم توكن الطلب حتى تُسجّل الصفوف تحت auth.uid() وتحترم قواعد الوصول.
 */
export async function recordTurnEvent(
  bearer: string | null,
  row: {
    matchId: string;
    turn: number;
    kind: "start" | "roll" | "forfeit" | "timeout" | "reject";
    elapsedMs: number;
    limitMs: number;
    accepted: boolean;
    reason?: string | null;
  },
): Promise<void> {
  const token = (bearer ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return;
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return;

  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        headers.set("apikey", key);
        headers.set("Authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers });
      },
    },
  });

  try {
    await client.rpc("record_turn_event", {
      _match_id: row.matchId,
      _turn: row.turn,
      _kind: row.kind,
      _elapsed_ms: Math.round(row.elapsedMs),
      _limit_ms: Math.round(row.limitMs),
      _accepted: row.accepted,
      _reason: row.reason ?? null,
    });
  } catch {
    // تسجيل التدقيق لا يجب أن يُفشل المباراة
  }
}

/** تتبع ومزامنة رقم إصدار حالة المباراة في السيرفر لتصحيح فقدان الحزم (Packet Loss) */
const matchVersions = new Map<string, { version: number; updatedAt: number }>();

export function getOrUpdateMatchVersion(matchId: string, clientVersion: number): number {
  const now = Date.now();
  const current = matchVersions.get(matchId);
  if (!current) {
    const v = Math.max(0, clientVersion);
    matchVersions.set(matchId, { version: v, updatedAt: now });
    return v;
  }
  if (clientVersion > current.version) {
    current.version = clientVersion;
    current.updatedAt = now;
  }
  // تنظيف دوري للمباريات القديمة
  if (matchVersions.size > 200) {
    for (const [id, val] of matchVersions.entries()) {
      if (now - val.updatedAt > 2 * 60 * 60 * 1000) {
        matchVersions.delete(id);
      }
    }
  }
  return current.version;
}
