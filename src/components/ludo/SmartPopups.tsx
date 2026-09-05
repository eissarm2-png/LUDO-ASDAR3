import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Bell,
  Check,
  Coins,
  Crown,
  Dices,
  ExternalLink,
  Gift,
  Sparkles,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { listFriends, respondFriend, type FriendRow } from "@/lib/social.functions";
import { listInvites, respondInvite, type InviteRow } from "@/lib/invites.functions";
import { sfx } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export type SmartWinPayload = {
  winnerName: string;
  coinsWon?: number;
  xpWon?: number;
  badgeUnlocked?: string;
  onContinue: () => void;
  onViewBadges: () => void;
};

export type PointsNotificationPayload = {
  title: string;
  body: string;
  timeText?: string;
  amountText?: string;
  onDone?: () => void;
};

// Global event bus for smart win popups
let globalShowWinPopup: ((payload: SmartWinPayload | null) => void) | null = null;
let globalShowPointsPopup: ((payload: PointsNotificationPayload | null) => void) | null = null;

export function triggerSmartWinPopup(payload: SmartWinPayload) {
  if (globalShowWinPopup) {
    globalShowWinPopup(payload);
  }
}

export function triggerDeviceNotification(title: string, body: string) {
  try {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: "/favicon.png",
          badge: "/favicon.png",
        });
      } else if (Notification.permission !== "denied") {
        void Notification.requestPermission().then((perm) => {
          if (perm === "granted") {
            new Notification(title, {
              body,
              icon: "/favicon.png",
              badge: "/favicon.png",
            });
          }
        });
      }
    }
  } catch {
    // Ignore notification errors in restricted contexts
  }
}

export function triggerPointsNotification(payload: PointsNotificationPayload) {
  if (globalShowPointsPopup) {
    globalShowPointsPopup(payload);
  }
  triggerDeviceNotification(payload.title, payload.body);
}

export function SmartPopups({ onJoinRoom }: { onJoinRoom?: (roomCode: string) => void }) {
  const { user, refreshProfile } = useAuth();
  const fetchFriends = useServerFn(listFriends);
  const handleFriendResponse = useServerFn(respondFriend);
  const fetchGameInvites = useServerFn(listInvites);
  const handleInviteResponse = useServerFn(respondInvite);

  const [activeFriendReq, setActiveFriendReq] = useState<FriendRow | null>(null);
  const [activeGameInvite, setActiveGameInvite] = useState<InviteRow | null>(null);
  const [winPayload, setWinPayload] = useState<SmartWinPayload | null>(null);
  const [pointsPayload, setPointsPayload] = useState<PointsNotificationPayload | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    globalShowWinPopup = setWinPayload;
    globalShowPointsPopup = setPointsPayload;
    return () => {
      globalShowWinPopup = null;
      globalShowPointsPopup = null;
    };
  }, []);

  // Window event listener for points received
  useEffect(() => {
    const onPoints = (e: Event) => {
      const detail = (e as CustomEvent<PointsNotificationPayload>).detail;
      if (detail) {
        setPointsPayload({
          title: detail.title || "تم استلام نقاط جديدة 🎉",
          body: detail.body || "تم إضافة نقاط إلى رصيدك",
          timeText: detail.timeText || "الآن",
          amountText: detail.amountText,
          onDone: detail.onDone,
        });
        sfx.win();
        triggerDeviceNotification(detail.title, detail.body);
        void refreshProfile();
      }
    };
    window.addEventListener("points_received", onPoints);

    return () => {
      window.removeEventListener("points_received", onPoints);
    };
  }, [refreshProfile]);

  // Supabase realtime listener for points transfer notifications
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`popup-notif-transfer-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as {
            kind?: string;
            title: string;
            body: string;
            created_at: string;
          };
          if (
            row.kind === "points_transfer" ||
            row.title.includes("نقاط") ||
            row.body.includes("رصيدك")
          ) {
            setPointsPayload({
              title: row.title || "تم استلام نقاط جديدة 🎉",
              body: row.body || "تم تحديث رصيدك بنجاح",
              timeText: "الآن",
            });
            sfx.win();
            triggerDeviceNotification(row.title, row.body);
            void refreshProfile();
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, refreshProfile]);

  // Poll for incoming friend requests and invites when user is logged in
  useEffect(() => {
    if (!user) return;

    const checkIncoming = async () => {
      try {
        // Check game invites
        const invites = await fetchGameInvites();
        const pendingInvite = invites.find(
          (inv) => inv.direction === "incoming" && inv.status === "pending",
        );
        if (pendingInvite && (!activeGameInvite || activeGameInvite.id !== pendingInvite.id)) {
          setActiveGameInvite(pendingInvite);
          sfx.dice();
        }

        // Check friend requests
        const friendsList = await fetchFriends();
        const pendingReq = friendsList.find(
          (f) => f.direction === "incoming" && f.status === "pending",
        );
        if (
          pendingReq &&
          (!activeFriendReq || activeFriendReq.friendship_id !== pendingReq.friendship_id)
        ) {
          setActiveFriendReq(pendingReq);
          sfx.dice();
        }
      } catch {
        // silent fail during normal polling
      }
    };

    void checkIncoming();
    const interval = setInterval(checkIncoming, 8000);
    return () => clearInterval(interval);
  }, [user, fetchFriends, fetchGameInvites, activeGameInvite, activeFriendReq]);

  // Handle friend request action
  const onRespondFriend = async (accept: boolean) => {
    if (!activeFriendReq) return;
    setBusy(true);
    try {
      const res = await handleFriendResponse({
        data: { id: activeFriendReq.friendship_id, accept },
      });
      if (res.ok) {
        toast.success(accept ? `تمت إضافة ${activeFriendReq.display_name} كصديق!` : "تم رفض الطلب");
        sfx.button();
      } else {
        toast.error("تعذر تحديث الطلب");
      }
    } catch {
      toast.error("حدث خطأ أثناء الرد على الطلب");
    } finally {
      setActiveFriendReq(null);
      setBusy(false);
    }
  };

  // Handle game invite action
  const onRespondInvite = async (accept: boolean) => {
    if (!activeGameInvite) return;
    setBusy(true);
    try {
      const res = await handleInviteResponse({
        data: { id: activeGameInvite.id, accept },
      });
      if (res.ok && accept && res.room_code) {
        toast.success("جاري الانضمام للعبة...");
        sfx.start();
        onJoinRoom?.(res.room_code);
      } else if (!accept) {
        toast.info("تم رفض دعوة اللعب");
      }
    } catch {
      toast.error("تعذر قبول الدعوة");
    } finally {
      setActiveGameInvite(null);
      setBusy(false);
    }
  };

  const renderAvatarContent = (av?: string | null) => {
    if (!av) return <span>👑</span>;
    if (av.startsWith("data:") || av.startsWith("http")) {
      return <img src={av} alt="Avatar" className="size-full rounded-full object-cover" />;
    }
    return <span className="text-base">{av}</span>;
  };

  return (
    <>
      {/* إشعار منبثق لطلب الصداقة */}
      {activeFriendReq && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[94%] max-w-md animate-in slide-in-from-top-4 fade-in duration-300">
          <div
            className="flex items-center justify-between gap-3 rounded-2xl border-2 border-ludo-gold/80 bg-gradient-to-r from-[#5a144c] via-[#350730] to-[#1a0218] p-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-white"
            dir="rtl"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative grid size-11 shrink-0 place-items-center rounded-full border border-ludo-gold bg-black/60 shadow-md">
                {renderAvatarContent(activeFriendReq.avatar)}
                <span className="absolute -bottom-1 -right-1 text-xs">🤝</span>
              </div>
              <div className="min-w-0 text-right">
                <div className="flex items-center gap-1.5">
                  <UserPlus className="size-3.5 text-ludo-gold" />
                  <b className="truncate text-xs font-black text-ludo-gold">طلب صداقة جديد</b>
                </div>
                <p className="truncate text-xs font-semibold text-slate-200">
                  {activeFriendReq.display_name} يريد مصادقتك
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="play"
                size="sm"
                disabled={busy}
                onClick={() => void onRespondFriend(true)}
                className="h-8 px-2.5 text-xs font-black gap-1"
              >
                <Check className="size-3.5" /> قبول
              </Button>
              <Button
                variant="ghostGold"
                size="sm"
                disabled={busy}
                onClick={() => void onRespondFriend(false)}
                className="h-8 px-2 text-xs font-bold"
              >
                <X className="size-3.5" /> رفض
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* إشعار منبثق لدعوة لعبة مباشرة */}
      {activeGameInvite && !activeFriendReq && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[94%] max-w-md animate-in slide-in-from-top-4 fade-in duration-300">
          <div
            className="flex items-center justify-between gap-3 rounded-2xl border-2 border-cyan-400/80 bg-gradient-to-r from-[#123652] via-[#091b2c] to-[#040c14] p-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-white"
            dir="rtl"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative grid size-11 shrink-0 place-items-center rounded-full border border-cyan-400 bg-black/60 shadow-md">
                {renderAvatarContent(activeGameInvite.other_avatar)}
                <span className="absolute -bottom-1 -right-1 text-xs">🎲</span>
              </div>
              <div className="min-w-0 text-right">
                <div className="flex items-center gap-1.5">
                  <Dices className="size-3.5 text-cyan-300 animate-pulse" />
                  <b className="truncate text-xs font-black text-cyan-300">تحدي لودو مباشر!</b>
                </div>
                <p className="truncate text-xs font-semibold text-slate-200">
                  {activeGameInvite.other_name || "لاعب"} يدعوك لمباراة
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="royal"
                size="sm"
                disabled={busy}
                onClick={() => void onRespondInvite(true)}
                className="h-8 px-2.5 text-xs font-black gap-1 bg-cyan-600 hover:bg-cyan-500 border-cyan-300"
              >
                <Check className="size-3.5" /> دخول اللعبة
              </Button>
              <Button
                variant="ghostGold"
                size="sm"
                disabled={busy}
                onClick={() => void onRespondInvite(false)}
                className="h-8 px-2 text-xs font-bold border-cyan-400/30 text-cyan-200"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة إشعار الفوز الذكي التفاعلي (Smart Win Notification) */}
      {winPayload && (
        <div
          className="fixed inset-0 z-[110] grid place-items-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200"
          dir="rtl"
        >
          <div className="relative w-full max-w-sm rounded-3xl border-2 border-ludo-gold bg-gradient-to-b from-[#6e1c5a] via-[#3d0a33] to-[#1c0217] p-6 text-center shadow-[0_15px_40px_rgba(255,215,0,0.3)] space-y-4">
            {/* الشعار والتاج والنجوم */}
            <div className="relative mx-auto grid size-20 place-items-center rounded-full border-2 border-ludo-gold bg-gradient-to-br from-ludo-gold/30 to-black/60 shadow-[0_0_25px_rgba(255,215,0,0.6)]">
              <Trophy className="size-10 text-ludo-gold animate-bounce" />
              <Sparkles className="absolute top-1 right-1 size-5 text-yellow-300 animate-spin" />
            </div>

            <div>
              <span className="inline-block rounded-full bg-ludo-gold/20 border border-ludo-gold/40 px-3 py-1 text-xs font-black text-ludo-gold mb-1">
                🌟 إشعار الفوز الذكي
              </span>
              <h3 className="text-2xl font-black text-white drop-shadow-md">
                مبروك الفوز المستحق!
              </h3>
              <p className="text-sm font-bold text-ludo-gold mt-1">
                {winPayload.winnerName} تربع على عرش الطاولة
              </p>
            </div>

            {/* المكافآت والنقاط المكتسبة */}
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-ludo-gold/30 bg-black/50 p-3">
              <div className="text-center">
                <small className="block text-[11px] text-ludo-soft">ذهب إضافي</small>
                <b className="text-base font-black text-ludo-gold">
                  +{winPayload.coinsWon ?? 150} 🪙
                </b>
              </div>
              <div className="text-center border-r border-white/10">
                <small className="block text-[11px] text-ludo-soft">نقاط خبرة XP</small>
                <b className="text-base font-black text-cyan-400">+{winPayload.xpWon ?? 50} ⭐</b>
              </div>
            </div>

            {winPayload.badgeUnlocked && (
              <div className="rounded-xl border border-emerald-400/50 bg-emerald-950/40 p-2.5 flex items-center justify-center gap-2">
                <Crown className="size-4 text-emerald-400" />
                <span className="text-xs font-black text-emerald-300">
                  تم فتح شارة جديدة: {winPayload.badgeUnlocked}!
                </span>
              </div>
            )}

            {/* أزرار تفاعلية تعمل 100% بدون أي زر وهمي */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                variant="play"
                size="lg"
                onClick={() => {
                  const cb = winPayload.onContinue;
                  setWinPayload(null);
                  cb();
                }}
                className="w-full text-xs font-black"
              >
                متابعة اللعب 🎲
              </Button>
              <Button
                variant="ghostGold"
                size="lg"
                onClick={() => {
                  const cb = winPayload.onViewBadges;
                  setWinPayload(null);
                  cb();
                }}
                className="w-full text-xs font-bold"
              >
                عرض الشارات 🏅
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة استلام النقاط والتحويل الإداري — تظهر فوراً مع المؤثرات والأصوات */}
      {pointsPayload && (
        <div
          className="fixed inset-0 z-[120] grid place-items-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200"
          dir="rtl"
        >
          <div className="relative w-full max-w-sm rounded-3xl border-2 border-ludo-gold bg-gradient-to-b from-[#66164d] via-[#350727] to-[#14010f] p-6 text-center shadow-[0_20px_50px_rgba(255,215,0,0.35)] space-y-4">
            <button
              onClick={() => {
                const cb = pointsPayload.onDone;
                setPointsPayload(null);
                if (cb) cb();
              }}
              className="absolute top-3 left-3 size-8 rounded-full border border-ludo-gold/40 bg-black/60 grid place-items-center text-amber-200 hover:text-white transition active:scale-90"
              aria-label="إغلاق"
            >
              <X className="size-4" />
            </button>

            {/* أيقونة الجائزة والعملات المتحركة */}
            <div className="relative mx-auto grid size-20 place-items-center rounded-full border-2 border-ludo-gold bg-gradient-to-br from-amber-400/30 to-black/70 shadow-[0_0_30px_rgba(255,215,0,0.6)]">
              <Coins className="size-10 text-ludo-gold animate-bounce" />
              <Sparkles className="absolute top-1 right-1 size-5 text-yellow-300 animate-spin" />
            </div>

            <div>
              <span className="inline-block rounded-full bg-ludo-gold/20 border border-ludo-gold/50 px-3 py-1 text-xs font-black text-ludo-gold mb-1.5 shadow-sm">
                🎁 إشعار تحويل رصيد رسمي
              </span>
              <h3 className="text-xl font-black text-white drop-shadow-md">
                {pointsPayload.title}
              </h3>
              <p className="text-sm font-bold text-amber-200 mt-1.5 leading-relaxed bg-black/40 rounded-xl p-2.5 border border-ludo-gold/30">
                {pointsPayload.body}
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] text-ludo-soft px-1">
              <span>الحالة: تم التحويل بنجاح في قاعدة البيانات</span>
              <span className="font-bold text-amber-300">{pointsPayload.timeText || "الآن"}</span>
            </div>

            <div className="pt-2">
              <Button
                variant="play"
                size="lg"
                onClick={() => {
                  const cb = pointsPayload.onDone;
                  setPointsPayload(null);
                  if (cb) cb();
                }}
                className="w-full text-sm font-black shadow-lg"
              >
                رائع! تم الاستلام بنجاح 💎
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
