// حفظ التقدم العام والمباريات الجارية لكل مستخدم لمنع فقدان اللعب
// User Progress & Active Game Persistence

import type { GameState } from "@/lib/engine";

export type SavedMatchState = {
  id: string;
  savedAt: number;
  mode: "ludo" | "domino";
  playerCount: number;
  seatIndex: number;
  tournamentInfo?: {
    id: string;
    name: string;
    icon: string;
    round: string;
    roundNumber: number;
    prizeGold: number;
    prizeDiamonds: number;
  };
  game: GameState;
};

const SAVED_MATCH_KEY = "abqor_active_match_backup_v1";

function isStorageAvailable(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      typeof window.localStorage !== "undefined" &&
      window.localStorage !== null
    );
  } catch {
    return false;
  }
}

/** حفظ حالة المباراة الجارية تلقائياً */
export function saveActiveMatch(state: SavedMatchState): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(SAVED_MATCH_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("Could not save active match:", err);
  }
}

/** استرجاع المباراة المحفوظة إن كانت حديثة (خلال آخر ساعة) */
export function loadActiveMatch(): SavedMatchState | null {
  if (!isStorageAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(SAVED_MATCH_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SavedMatchState;
    // إن كانت أقدم من 60 دقيقة نعتبرها منتهية
    if (Date.now() - data.savedAt > 60 * 60 * 1000) {
      clearActiveMatch();
      return null;
    }
    return data;
  } catch (err) {
    console.warn("Could not load active match:", err);
    return null;
  }
}

/** مسح المباراة المحفوظة عند انتهاء المباراة بشكل طبيعي */
export function clearActiveMatch(): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.removeItem(SAVED_MATCH_KEY);
  } catch {
    // ignore
  }
}

export type LocalUserProgress = {
  userId: string;
  level: number;
  xp: number;
  points: number;
  games: number;
  wins: number;
  losses: number;
  winStreak: number;
  maxWinStreak: number;
  gold: number;
  diamonds: number;
  lastUpdated: number;
};

function getProgressKey(userId: string | null | undefined): string {
  const safeId = userId && userId.trim() ? userId.trim() : "guest_player";
  return `ludo_user_progression_v1_${safeId}`;
}

export function loadUserLocalProgress(userId: string | null | undefined): LocalUserProgress {
  const key = getProgressKey(userId);
  if (isStorageAvailable()) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw) as LocalUserProgress;
      }
    } catch (err) {
      console.warn("Error loading local user progress:", err);
    }
  }

  return {
    userId: userId || "guest_player",
    level: 1,
    xp: 0,
    points: 100,
    games: 0,
    wins: 0,
    losses: 0,
    winStreak: 0,
    maxWinStreak: 0,
    gold: 5000,
    diamonds: 20,
    lastUpdated: Date.now(),
  };
}

export function saveUserLocalProgress(
  userId: string | null | undefined,
  patch: Partial<LocalUserProgress>,
): LocalUserProgress {
  const current = loadUserLocalProgress(userId);
  const updated: LocalUserProgress = {
    ...current,
    ...patch,
    lastUpdated: Date.now(),
  };

  // ترقية المستوى تلقائياً عند زيادة الخبرة (كل 300 نقطة خبرة = مستوى جديد)
  if (updated.xp) {
    const calculatedLevel = Math.max(1, Math.floor(updated.xp / 300) + 1);
    if (calculatedLevel > updated.level) {
      updated.level = calculatedLevel;
    }
  }

  if (isStorageAvailable()) {
    const key = getProgressKey(userId);
    try {
      window.localStorage.setItem(key, JSON.stringify(updated));
    } catch (err) {
      console.warn("Error saving user local progress:", err);
    }
  }

  return updated;
}
