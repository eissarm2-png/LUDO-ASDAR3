import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Coins,
  Crown,
  Flame,
  Gem,
  Gift,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { sfx } from "@/lib/audio";
import {
  DAILY_REWARDS,
  claimDailyRewardApi,
  getDailyRewardState,
  type DailyRewardItem,
} from "@/lib/daily-reward";
import { ART } from "@/components/ludo/economy-visuals";

type DailyRewardModalProps = {
  isOpen: boolean;
  onClose: () => void;
  autoOpened?: boolean;
};

// جزيئات الاحتفال البصرية المتفجرة عند الاستلام (CSS Animation)
const CLAIM_BURST_PARTICLES = [
  { icon: "🪙", tx: "-120px", ty: "-180px", tr: "-65deg", delay: "0ms", size: "text-3xl" },
  { icon: "✨", tx: "110px", ty: "-210px", tr: "120deg", delay: "40ms", size: "text-2xl" },
  { icon: "🪙", tx: "-160px", ty: "-110px", tr: "180deg", delay: "80ms", size: "text-3xl" },
  { icon: "💎", tx: "150px", ty: "-130px", tr: "-140deg", delay: "60ms", size: "text-2xl" },
  { icon: "⭐", tx: "-50px", ty: "-240px", tr: "45deg", delay: "20ms", size: "text-2xl" },
  { icon: "🎉", tx: "50px", ty: "-250px", tr: "-90deg", delay: "90ms", size: "text-3xl" },
  { icon: "🪙", tx: "-130px", ty: "-50px", tr: "210deg", delay: "120ms", size: "text-2xl" },
  { icon: "👑", tx: "120px", ty: "-60px", tr: "-180deg", delay: "110ms", size: "text-2xl" },
  { icon: "✨", tx: "-80px", ty: "-140px", tr: "30deg", delay: "30ms", size: "text-xl" },
  { icon: "🪙", tx: "80px", ty: "-160px", tr: "-45deg", delay: "70ms", size: "text-3xl" },
  { icon: "⭐", tx: "0px", ty: "-280px", tr: "0deg", delay: "10ms", size: "text-2xl" },
  { icon: "🪙", tx: "-30px", ty: "-190px", tr: "25deg", delay: "100ms", size: "text-2xl" },
  { icon: "💎", tx: "-90px", ty: "-230px", tr: "-30deg", delay: "130ms", size: "text-xl" },
  { icon: "✨", tx: "95px", ty: "-220px", tr: "80deg", delay: "140ms", size: "text-2xl" },
];

export function DailyRewardModal({ isOpen, onClose, autoOpened }: DailyRewardModalProps) {
  const { user, profile, refreshProfile, updateProfileLocally } = useAuth();

  const [claiming, setClaiming] = useState(false);
  const [justClaimedReward, setJustClaimedReward] = useState<DailyRewardItem | null>(null);
  const [showClaimAnimation, setShowClaimAnimation] = useState(false);
  const [streak, setStreak] = useState(1);
  const [claimedToday, setClaimedToday] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // تحديث الحالة عند فتح النافذة
  useEffect(() => {
    if (!isOpen) {
      setJustClaimedReward(null);
      setShowClaimAnimation(false);
      return;
    }

    const state = getDailyRewardState(user?.id);
    setStreak(state.currentStreak);
    setClaimedToday(state.hasClaimedToday);
    setTimeLeft(state.msUntilMidnight);
  }, [isOpen, user?.id]);

  // عداد تنازلي للغد إذا كان قد استلم اليوم
  useEffect(() => {
    if (!isOpen || !claimedToday) return;

    const timer = setInterval(() => {
      const state = getDailyRewardState(user?.id);
      setTimeLeft(state.msUntilMidnight);
      if (!state.hasClaimedToday) {
        setClaimedToday(false);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, claimedToday, user?.id]);

  if (!isOpen) return null;

  const currentReward = DAILY_REWARDS[streak - 1] ?? DAILY_REWARDS[0];

  const formatCountdown = (ms: number) => {
    const totalSecs = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClaim = async () => {
    if (claiming || claimedToday) return;
    setClaiming(true);

    try {
      const { reward } = await claimDailyRewardApi({
        user,
        profile,
        refreshProfile,
        updateProfileLocally,
      });

      sfx.win();
      setJustClaimedReward(reward);
      setClaimedToday(true);
      setShowClaimAnimation(true);

      toast.success(
        `تهانينا! استلمت ${reward.gold.toLocaleString("ar-EG")} قطعة ذهبية مجاناً! 🪙✨`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "تعذر استلام المكافأة، حاول مرة أخرى";
      toast.error(msg);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div
      id="daily-reward-modal-backdrop"
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-3 backdrop-blur-md animate-in fade-in duration-200"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        id="daily-reward-modal-card"
        className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border-2 border-ludo-gold bg-gradient-to-b from-[#5c1348] via-[#2d0526] to-[#120210] p-4 text-center shadow-[0_20px_50px_rgba(255,215,0,0.35)] md:p-5"
      >
        {/* زر الإغلاق */}
        <button
          id="daily-reward-close-btn"
          onClick={onClose}
          className="absolute top-3 left-3 grid size-8 place-items-center rounded-full border border-ludo-gold/30 bg-black/40 text-ludo-soft transition hover:border-ludo-gold hover:text-white"
          aria-label="إغلاق"
        >
          <X className="size-4" />
        </button>

        {/* وميض ديكوري علوي */}
        <div className="pointer-events-none absolute -top-12 inset-x-0 h-24 bg-[radial-gradient(circle_at_center,#f6c32c40,transparent_70%)]" />

        {/* الرأس البصري */}
        <div className="relative z-10 flex flex-col items-center pt-1 pb-2">
          <div className="relative mb-2 grid size-16 place-items-center rounded-2xl border-2 border-ludo-gold bg-gradient-to-br from-ludo-gold/30 to-black/60 shadow-[0_0_20px_rgba(255,215,0,0.5)]">
            <img src={ART.gift} alt="Gift" className="size-11 object-contain drop-shadow-md" />
            <Sparkles className="absolute -top-1.5 -right-1.5 size-5 text-yellow-300 animate-spin" />
            <Flame className="absolute -bottom-1.5 -left-1.5 size-4 text-amber-400" />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-ludo-gold/40 bg-ludo-gold/15 px-3 py-0.5 text-xs font-black text-ludo-gold">
            <Gift className="size-3.5" />
            <span>هدية الدخول اليومية</span>
            {autoOpened && <span className="mr-1 text-[10px] text-amber-300">• فتح تلقائي</span>}
          </div>

          <h2 className="mt-1 text-xl font-black text-white drop-shadow-md md:text-2xl">
            المكافأة اليومية الملكية
          </h2>
          <p className="text-xs font-semibold text-ludo-gold/90">
            سجّل دخولك كل يوم واكسب ذهباً وفيراً وجوائز مضاعفة!
          </p>
        </div>

        {/* شبكة الأيام السبعة */}
        <div className="my-3 grid grid-cols-3 gap-2 overflow-y-auto px-1">
          {DAILY_REWARDS.slice(0, 6).map((item) => {
            const isCompleted = claimedToday ? item.day <= streak : item.day < streak;
            const isCurrent = !claimedToday && item.day === streak;
            const isFuture = item.day > streak;

            return (
              <div
                key={item.day}
                id={`daily-reward-day-${item.day}`}
                className={`relative flex flex-col items-center justify-between rounded-2xl border p-2.5 transition-all ${
                  isCurrent
                    ? "scale-105 border-ludo-gold bg-gradient-to-b from-amber-500/25 to-black/70 shadow-[0_0_15px_rgba(255,215,0,0.4)] ring-2 ring-ludo-gold/80"
                    : isCompleted
                      ? "border-emerald-500/40 bg-black/40 opacity-75"
                      : "border-white/10 bg-black/30 opacity-80"
                }`}
              >
                {/* علامة اكتمال الاستلام */}
                {isCompleted && (
                  <span className="absolute top-1.5 right-1.5 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="size-4 fill-emerald-500 text-black" />
                  </span>
                )}

                {/* مؤشر اليوم الحالي */}
                {isCurrent && (
                  <span className="absolute -top-2 rounded-full bg-ludo-gold px-2 py-0.5 text-[9px] font-black text-ludo-deep shadow-sm">
                    اليوم 🎁
                  </span>
                )}

                <span className="text-[11px] font-bold text-slate-300">{item.label}</span>

                <div className="my-1 grid size-9 place-items-center">
                  <img
                    src={item.diamonds > 0 ? ART.diamonds : ART.gold}
                    alt=""
                    className={`size-7 object-contain drop-shadow ${
                      isCurrent ? "animate-pulse" : ""
                    }`}
                  />
                </div>

                <div className="flex flex-col items-center">
                  <span className="flex items-center gap-0.5 text-xs font-black text-ludo-gold">
                    <Coins className="size-3 text-amber-400" />+{item.gold.toLocaleString("ar-EG")}
                  </span>
                  {item.diamonds > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] font-black text-cyan-300">
                      <Gem className="size-2.5" />+{item.diamonds}
                    </span>
                  )}
                </div>

                {isCompleted ? (
                  <span className="mt-1 text-[10px] font-bold text-emerald-400">مُستلم ✓</span>
                ) : isCurrent ? (
                  <span className="mt-1 text-[10px] font-black text-amber-300">جاهز الآن!</span>
                ) : (
                  <span className="mt-1 text-[10px] text-slate-500">اليوم {item.day}</span>
                )}
              </div>
            );
          })}

          {/* اليوم السابع: الجائزة الملكية الكبرى بعرض كامل */}
          {(() => {
            const day7 = DAILY_REWARDS[6];
            const isCompleted7 = claimedToday ? day7.day <= streak : day7.day < streak;
            const isCurrent7 = !claimedToday && day7.day === streak;

            return (
              <div
                id="daily-reward-day-7"
                className={`relative col-span-3 flex items-center justify-between rounded-2xl border-2 p-3 transition-all ${
                  isCurrent7
                    ? "border-ludo-gold bg-gradient-to-r from-amber-600/30 via-yellow-500/20 to-black/70 shadow-[0_0_20px_rgba(255,215,0,0.5)] ring-2 ring-ludo-gold"
                    : isCompleted7
                      ? "border-emerald-500/40 bg-black/40 opacity-75"
                      : "border-ludo-gold/40 bg-gradient-to-r from-[#69184d]/40 to-black/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative grid size-12 place-items-center rounded-xl border border-ludo-gold/60 bg-gradient-to-br from-ludo-gold/30 to-black/60 shadow-md">
                    <Crown className="size-7 text-ludo-gold animate-bounce" />
                    <Sparkles className="absolute top-0 right-0 size-3.5 text-yellow-300" />
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-full bg-ludo-gold/20 px-2 py-0.5 text-[10px] font-black text-ludo-gold border border-ludo-gold/40">
                        اليوم 7
                      </span>
                      <h4 className="text-sm font-black text-white">{day7.label}</h4>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1 text-xs font-black text-ludo-gold">
                        <Coins className="size-3 text-amber-400" />+
                        {day7.gold.toLocaleString("ar-EG")} ذهب
                      </span>
                      <span className="flex items-center gap-0.5 text-xs font-black text-cyan-300">
                        <Gem className="size-3" />+{day7.diamonds} ماسة
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  {isCompleted7 ? (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-black text-emerald-400 border border-emerald-500/40">
                      <CheckCircle2 className="size-3.5" /> استُلمت
                    </span>
                  ) : isCurrent7 ? (
                    <span className="rounded-full bg-ludo-gold px-3 py-1 text-xs font-black text-ludo-deep shadow-sm animate-pulse">
                      استلم الآن!
                    </span>
                  ) : (
                    <span className="rounded-full bg-black/50 border border-white/10 px-2.5 py-1 text-[11px] font-bold text-slate-400">
                      الجائزة الكبرى 👑
                    </span>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* تأثير بصري احتفالي متفجر عند الاستلام (CSS Animation) */}
        {showClaimAnimation && (
          <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center overflow-hidden">
            {/* موجات الصدمة الذهبية المتوسعة */}
            <div className="absolute size-44 rounded-full border-4 border-amber-300 bg-amber-400/25 shadow-[0_0_50px_rgba(255,215,0,0.85)] animate-claim-shockwave" />
            <div
              className="absolute size-64 rounded-full border-2 border-yellow-200 bg-yellow-300/15 animate-claim-shockwave"
              style={{ animationDelay: "150ms" }}
            />

            {/* أشعة الشمس الملكية الدوارة في الخلفية */}
            <div className="absolute size-[480px] rounded-full bg-[conic-gradient(from_0deg,rgba(255,215,0,0.22)_0deg,transparent_30deg,rgba(255,215,0,0.22)_60deg,transparent_90deg,rgba(255,215,0,0.22)_120deg,transparent_150deg,rgba(255,215,0,0.22)_180deg,transparent_210deg,rgba(255,215,0,0.22)_240deg,transparent_270deg,rgba(255,215,0,0.22)_300deg,transparent_330deg,rgba(255,215,0,0.22)_360deg)] animate-claim-rays opacity-75" />

            {/* سيل الجواهر والعملات الذهبية المتطايرة بحركات فيزيائية واقعية */}
            <div className="absolute bottom-20 inset-x-0 flex justify-center">
              {CLAIM_BURST_PARTICLES.map((p, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "absolute select-none animate-claim-particle drop-shadow-lg",
                    p.size,
                  )}
                  style={
                    {
                      "--tx": p.tx,
                      "--ty": p.ty,
                      "--tr": p.tr,
                      animationDelay: p.delay,
                    } as React.CSSProperties
                  }
                >
                  {p.icon}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* بطاقة التهنئة الفورية عند الاستلام */}
        {justClaimedReward ? (
          <div className="my-2 relative overflow-hidden rounded-2xl border-2 border-ludo-gold bg-gradient-to-r from-emerald-900/60 via-amber-900/50 to-black/80 p-3.5 text-center shadow-[0_0_25px_rgba(255,215,0,0.5)] animate-claim-badge">
            <div className="pointer-events-none absolute -top-10 inset-x-0 h-20 bg-[radial-gradient(circle_at_center,#ffd70060,transparent_70%)] animate-pulse" />
            <div className="relative z-10 flex flex-col items-center">
              <span className="text-3xl animate-bounce">🎉</span>
              <h4 className="text-base font-black text-white drop-shadow-md">
                تم استلام مكافأتك الملكية بنجاح!
              </h4>
              <div className="mt-1.5 inline-flex items-center gap-2 rounded-xl border border-amber-300/50 bg-black/60 px-3.5 py-1 text-sm font-black text-amber-300 shadow-inner">
                <span>+{justClaimedReward.gold.toLocaleString("ar-EG")} قطعة ذهبية 🪙</span>
                {justClaimedReward.diamonds > 0 && (
                  <span>و +{justClaimedReward.diamonds} ماسة 💎</span>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* زر الإجراء الرئيسي */}
        <div className="mt-2 pt-1">
          {!claimedToday ? (
            <Button
              id="daily-reward-claim-btn"
              variant="play"
              size="lg"
              disabled={claiming}
              onClick={() => void handleClaim()}
              className="relative overflow-hidden w-full h-12 text-base font-black border-2 border-yellow-300 shadow-[0_8px_25px_rgba(255,215,0,0.5)] animate-golden-btn-pulse active:scale-95 transition-transform"
            >
              {claiming ? (
                <>
                  <Loader2 className="size-5 animate-spin" /> جاري الاستلام...
                </>
              ) : (
                <>
                  <Gift className="size-5 animate-bounce" /> استلم هدية اليوم (+
                  {currentReward.gold.toLocaleString("ar-EG")} ذهب) ✨
                </>
              )}
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/50 py-2 px-3 text-xs text-slate-300">
                <Clock className="size-4 text-ludo-gold" />
                <span>المكافأة التالية متاحة بعد:</span>
                <b className="font-mono text-sm font-black text-ludo-gold">
                  {formatCountdown(timeLeft)}
                </b>
              </div>
              <Button
                id="daily-reward-done-btn"
                variant="royal"
                size="lg"
                onClick={onClose}
                className="w-full h-11 text-sm font-bold"
              >
                رائع! العودة إلى اللعبة 🎲
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
