import { useEffect, useState } from "react";
import {
  Award,
  CheckCircle2,
  Clock,
  Coins,
  Crown,
  Flame,
  Gem,
  Gift,
  Loader2,
  RotateCcw,
  Sparkles,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { sfx } from "@/lib/audio";
import { cn } from "@/lib/utils";

type DailyReward = {
  day: number;
  label: string;
  gold: number;
  diamonds: number;
  xp: number;
  icon: string;
  isSpecial?: boolean;
};

const DAILY_REWARDS: DailyReward[] = [
  { day: 1, label: "اليوم الأول", gold: 500, diamonds: 0, xp: 20, icon: "🪙" },
  { day: 2, label: "اليوم الثاني", gold: 1000, diamonds: 10, xp: 30, icon: "🪙" },
  { day: 3, label: "اليوم الثالث", gold: 1500, diamonds: 30, xp: 40, icon: "💎" },
  { day: 4, label: "اليوم الرابع", gold: 2000, diamonds: 40, xp: 50, icon: "🎁" },
  { day: 5, label: "اليوم الخامس", gold: 3000, diamonds: 60, xp: 60, icon: "💎" },
  { day: 6, label: "اليوم السادس", gold: 4000, diamonds: 80, xp: 80, icon: "⭐" },
  {
    day: 7,
    label: "الجائزة الملكية",
    gold: 6000,
    diamonds: 150,
    xp: 150,
    icon: "👑",
    isSpecial: true,
  },
];

const SPIN_PRIZES = [
  { label: "300 ذهب", gold: 300, diamonds: 0, icon: "🪙", color: "from-amber-500 to-yellow-600" },
  { label: "15 ماسة", gold: 0, diamonds: 15, icon: "💎", color: "from-cyan-500 to-blue-600" },
  { label: "800 ذهب", gold: 800, diamonds: 0, icon: "💰", color: "from-amber-400 to-amber-600" },
  { label: "50 ماسة", gold: 0, diamonds: 50, icon: "💎", color: "from-purple-500 to-indigo-600" },
  {
    label: "1,500 ذهب",
    gold: 1500,
    diamonds: 0,
    icon: "🪙",
    color: "from-yellow-400 to-amber-500",
  },
  { label: "30 ماسة", gold: 0, diamonds: 30, icon: "💎", color: "from-sky-400 to-cyan-600" },
  { label: "500 ذهب", gold: 500, diamonds: 0, icon: "🪙", color: "from-amber-600 to-yellow-700" },
  {
    label: "صندوق ملكي 2,500 ذهب",
    gold: 2500,
    diamonds: 75,
    icon: "👑",
    color: "from-rose-500 to-pink-600",
  },
];

export function RewardsScreen({ onBack }: { onBack: () => void }) {
  const { user, profile, refreshProfile } = useAuth();
  const [claiming, setClaiming] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [spinRotation, setSpinRotation] = useState(0);
  const [spinWonPrize, setSpinWonPrize] = useState<string | null>(null);

  // Storage keys for streak & times
  const streakKey = user ? `ludo_daily_streak_${user.id}` : "ludo_daily_streak_guest";
  const lastClaimKey = user ? `ludo_daily_last_${user.id}` : "ludo_daily_last_guest";
  const lastSpinKey = user ? `ludo_spin_last_${user.id}` : "ludo_spin_last_guest";
  const lastBonusKey = user ? `ludo_bonus_last_${user.id}` : "ludo_bonus_last_guest";

  const [currentStreak, setCurrentStreak] = useState<number>(() => {
    const s = localStorage.getItem(streakKey);
    return s ? Math.max(1, Math.min(7, parseInt(s, 10))) : 1;
  });

  const [hasClaimedToday, setHasClaimedToday] = useState<boolean>(() => {
    const last = localStorage.getItem(lastClaimKey);
    if (!last) return false;
    const lastDate = new Date(last).toDateString();
    const today = new Date().toDateString();
    return lastDate === today;
  });

  const [spinCooldown, setSpinCooldown] = useState<number>(0);
  const [bonusCooldown, setBonusCooldown] = useState<number>(0);

  // Check cooldowns
  useEffect(() => {
    const checkCooldowns = () => {
      const lastSpin = localStorage.getItem(lastSpinKey);
      if (lastSpin) {
        const diff = Date.now() - parseInt(lastSpin, 10);
        const remaining = Math.max(0, 12 * 3600 * 1000 - diff);
        setSpinCooldown(remaining);
      } else {
        setSpinCooldown(0);
      }

      const lastBonus = localStorage.getItem(lastBonusKey);
      if (lastBonus) {
        const diff = Date.now() - parseInt(lastBonus, 10);
        const remaining = Math.max(0, 4 * 3600 * 1000 - diff);
        setBonusCooldown(remaining);
      } else {
        setBonusCooldown(0);
      }
    };

    checkCooldowns();
    const timer = setInterval(checkCooldowns, 1000);
    return () => clearInterval(timer);
  }, [lastSpinKey, lastBonusKey]);

  const formatTimer = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Claim daily streak reward
  const handleClaimDaily = async () => {
    if (hasClaimedToday || claiming) return;

    setClaiming(true);
    const reward = DAILY_REWARDS[currentStreak - 1];

    try {
      if (user && profile) {
        const newGold = (profile.gold ?? 0) + reward.gold;
        const newDiamonds = (profile.diamonds ?? 0) + reward.diamonds;
        const newXp = (profile.xp ?? 0) + reward.xp;

        await supabase
          .from("profiles")
          .update({ gold: newGold, diamonds: newDiamonds, xp: newXp })
          .eq("id", user.id);

        await refreshProfile();
      }

      localStorage.setItem(lastClaimKey, new Date().toISOString());
      setHasClaimedToday(true);

      const nextStreak = currentStreak >= 7 ? 1 : currentStreak + 1;
      localStorage.setItem(streakKey, nextStreak.toString());
      setCurrentStreak(nextStreak);

      sfx.win();
      toast.success(
        `تهانينا! استلمت مكافأة ${reward.label}: ${reward.gold.toLocaleString("ar-EG")} عملة ذهبية${
          reward.diamonds ? ` و ${reward.diamonds} ماسة` : ""
        } 👑✨`,
      );
    } catch {
      toast.error("تعذر استلام المكافأة، حاول مرة أخرى");
    } finally {
      setClaiming(false);
    }
  };

  // Spin Lucky Wheel
  const handleSpinWheel = async () => {
    if (spinning || spinCooldown > 0) return;

    setSpinning(true);
    setSpinWonPrize(null);

    // Pick random prize
    const prizeIndex = Math.floor(Math.random() * SPIN_PRIZES.length);
    const prize = SPIN_PRIZES[prizeIndex];

    // Compute rotation: 5 full spins + segment angle
    const segmentAngle = 360 / SPIN_PRIZES.length;
    const targetAngle =
      360 * 5 + (SPIN_PRIZES.length - prizeIndex) * segmentAngle - segmentAngle / 2;
    const newTotalRotation = spinRotation + targetAngle;
    setSpinRotation(newTotalRotation);

    sfx.roll();

    setTimeout(async () => {
      setSpinning(false);
      setSpinWonPrize(prize.label);
      localStorage.setItem(lastSpinKey, Date.now().toString());
      setSpinCooldown(12 * 3600 * 1000);

      try {
        if (user && profile) {
          const newGold = (profile.gold ?? 0) + prize.gold;
          const newDiamonds = (profile.diamonds ?? 0) + prize.diamonds;

          await supabase
            .from("profiles")
            .update({ gold: newGold, diamonds: newDiamonds })
            .eq("id", user.id);

          await refreshProfile();
        }

        sfx.win();
        toast.success(`مبروك! ربحت من عجلة الحظ: ${prize.label} 🎰🎉`);
      } catch {
        toast.error("حدث خطأ أثناء تحديث الرصيد");
      }
    }, 3800);
  };

  // Claim 4-hour bonus
  const handleClaimBonus = async () => {
    if (bonusCooldown > 0) return;

    try {
      const bonusGold = 250;
      if (user && profile) {
        await supabase
          .from("profiles")
          .update({ gold: (profile.gold ?? 0) + bonusGold })
          .eq("id", user.id);
        await refreshProfile();
      }

      localStorage.setItem(lastBonusKey, Date.now().toString());
      setBonusCooldown(4 * 3600 * 1000);
      sfx.home();
      toast.success("تم استلام مكافأة الصندوق السريع (+250 ذهب) بنجاح! 🪙");
    } catch {
      toast.error("تعذر استلام المكافأة");
    }
  };

  return (
    <div className="space-y-4 pb-8" dir="rtl">
      {/* بطاقة الترحيب بالمكافآت */}
      <section className="relative overflow-hidden rounded-2xl border-2 border-ludo-gold/60 bg-gradient-to-b from-[#4a123f] via-[#2a0725] to-[#140212] p-4 shadow-[0_8px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <div className="grid size-14 place-items-center rounded-2xl border border-ludo-gold bg-ludo-gold/20 shadow-md">
            <Gift className="size-8 text-ludo-gold animate-bounce" />
          </div>
          <div className="min-w-0 flex-1 text-right">
            <h3 className="text-lg font-black text-ludo-gold drop-shadow flex items-center gap-1.5">
              <Sparkles className="size-4" /> مركز المكافآت والجوائز الملكية
            </h3>
            <p className="text-xs text-ludo-soft">
              احصل على ذهب وماس يومي مجاناً لترقية رتبتك وتحدي أقوى الخصوم!
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl border border-ludo-gold/30 bg-black/40 p-2.5">
          <span className="flex items-center gap-1.5 text-xs font-bold text-white">
            <Flame className="size-4 text-rose-400" /> سلسلة الدخول المتتالي:
            <b className="text-ludo-gold">{currentStreak} من 7 أيام</b>
          </span>
          {hasClaimedToday ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
              <CheckCircle2 className="size-3.5" /> تم الاستلام اليوم
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-ludo-gold/20 border border-ludo-gold/60 px-2.5 py-0.5 text-[11px] font-black text-ludo-gold animate-pulse">
              هدية اليوم جاهزة!
            </span>
          )}
        </div>
      </section>

      {/* شريط الأيام السبعة لتسجيل الدخول */}
      <section className="rounded-2xl border border-ludo-gold/40 bg-gradient-to-b from-[#2e092b] to-[#150214] p-3.5 space-y-3">
        <div className="flex items-center justify-between border-b border-ludo-gold/20 pb-2">
          <h4 className="text-sm font-black text-ludo-gold flex items-center gap-1.5">
            <Crown className="size-4 text-ludo-gold" /> مكافأة الحضور اليومي (7 أيام)
          </h4>
          <span className="text-[10px] text-ludo-soft">تتجدد المكافآت كل 24 ساعة</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {DAILY_REWARDS.slice(0, 4).map((r) => {
            const isToday = r.day === currentStreak;
            const isPast = r.day < currentStreak || (isToday && hasClaimedToday);
            return (
              <div
                key={r.day}
                className={cn(
                  "relative flex flex-col items-center justify-between rounded-xl border p-2 text-center transition",
                  isToday && !hasClaimedToday
                    ? "border-ludo-gold bg-gradient-to-b from-ludo-gold/30 to-black/60 shadow-[0_0_12px_rgba(255,215,0,0.4)] scale-105"
                    : isPast
                      ? "border-emerald-500/40 bg-emerald-950/30 opacity-75"
                      : "border-white/10 bg-black/40 opacity-70",
                )}
              >
                <span className="text-[10px] font-bold text-ludo-soft">{r.label}</span>
                <span className="text-2xl my-1">{r.icon}</span>
                <span className="text-xs font-black text-ludo-gold">+{r.gold}</span>
                {r.diamonds > 0 && (
                  <span className="text-[9px] font-bold text-cyan-300">+{r.diamonds} 💎</span>
                )}
                {isPast && (
                  <span className="absolute top-1 left-1 grid size-4 place-items-center rounded-full bg-emerald-500 text-black text-[10px] font-bold">
                    ✓
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {DAILY_REWARDS.slice(4).map((r) => {
            const isToday = r.day === currentStreak;
            const isPast = r.day < currentStreak || (isToday && hasClaimedToday);
            return (
              <div
                key={r.day}
                className={cn(
                  "relative flex flex-col items-center justify-between rounded-xl border p-2.5 text-center transition",
                  r.isSpecial
                    ? "col-span-1 border-ludo-gold bg-gradient-to-b from-[#6b1e56] to-[#2b0824] shadow-md"
                    : isToday && !hasClaimedToday
                      ? "border-ludo-gold bg-gradient-to-b from-ludo-gold/30 to-black/60 shadow-[0_0_12px_rgba(255,215,0,0.4)] scale-105"
                      : isPast
                        ? "border-emerald-500/40 bg-emerald-950/30 opacity-75"
                        : "border-white/10 bg-black/40 opacity-70",
                )}
              >
                <span className="text-[10px] font-bold text-ludo-soft">{r.label}</span>
                <span className="text-3xl my-1">{r.icon}</span>
                <span className="text-xs font-black text-ludo-gold">+{r.gold} ذهب</span>
                {r.diamonds > 0 && (
                  <span className="text-[10px] font-bold text-cyan-300">+{r.diamonds} ماسة</span>
                )}
                {isPast && (
                  <span className="absolute top-1.5 left-1.5 grid size-4 place-items-center rounded-full bg-emerald-500 text-black text-[10px] font-bold">
                    ✓
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <Button
          variant={hasClaimedToday ? "ghostGold" : "play"}
          size="xl"
          disabled={hasClaimedToday || claiming}
          onClick={() => void handleClaimDaily()}
          className="w-full text-base font-black shadow-lg"
        >
          {claiming ? (
            <Loader2 className="size-5 animate-spin" />
          ) : hasClaimedToday ? (
            <span className="flex items-center gap-1.5 text-emerald-300">
              <CheckCircle2 className="size-5" /> تم استلام مكافأة اليوم (عُد غداً لليوم التالي)
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Gift className="size-5" /> استلم هدية اليوم ({DAILY_REWARDS[currentStreak - 1]?.gold}{" "}
              ذهب)
            </span>
          )}
        </Button>
      </section>

      {/* عجلة الحظ الملكية */}
      <section className="rounded-2xl border border-ludo-gold/40 bg-gradient-to-b from-[#2b0825] to-[#120210] p-4 space-y-3 text-center">
        <div className="flex items-center justify-between border-b border-ludo-gold/20 pb-2">
          <h4 className="text-sm font-black text-ludo-gold flex items-center gap-1.5">
            <Award className="size-4 text-ludo-gold" /> عجلة الحظ الملكية
          </h4>
          <span className="text-[11px] font-bold text-ludo-soft">
            {spinCooldown > 0
              ? `دورة بعد: ${formatTimer(spinCooldown)}`
              : "دورة مجانية متاحة الآن!"}
          </span>
        </div>

        {/* تصميم قرص العجلة الدائري */}
        <div className="relative mx-auto my-3 size-48 grid place-items-center">
          {/* سهم التحديد العلوي */}
          <div className="absolute -top-3 z-10 size-0 border-x-8 border-x-transparent border-t-[14px] border-t-ludo-gold drop-shadow-md" />

          {/* القرص المتحرك */}
          <div
            className="size-full rounded-full border-4 border-ludo-gold bg-gradient-to-tr from-[#521342] via-[#85236b] to-[#380b2d] shadow-[0_0_20px_rgba(255,215,0,0.35)] relative overflow-hidden flex items-center justify-center transition-transform duration-[3800ms] ease-out"
            style={{ transform: `rotate(${spinRotation}deg)` }}
          >
            {/* شرائح الجوائز الملونة */}
            {SPIN_PRIZES.map((sp, idx) => {
              const rot = (360 / SPIN_PRIZES.length) * idx;
              return (
                <div
                  key={idx}
                  className="absolute top-0 left-1/2 -ml-[1px] h-1/2 w-[2px] origin-bottom"
                  style={{ transform: `rotate(${rot}deg)` }}
                >
                  <span className="absolute -top-1 -left-2.5 text-xs drop-shadow select-none">
                    {sp.icon}
                  </span>
                </div>
              );
            })}
            <div className="grid size-12 place-items-center rounded-full border-2 border-ludo-gold bg-gradient-to-b from-ludo-gold to-amber-600 text-black font-black text-xs shadow-inner">
              لَف!
            </div>
          </div>
        </div>

        {spinWonPrize && (
          <div className="rounded-xl border border-emerald-500/50 bg-emerald-950/40 p-2 text-xs font-bold text-emerald-400 animate-in fade-in">
            🎉 مبروك! حصلت على: {spinWonPrize}
          </div>
        )}

        <Button
          variant={spinCooldown > 0 ? "ghostGold" : "royal"}
          size="lg"
          disabled={spinning || spinCooldown > 0}
          onClick={() => void handleSpinWheel()}
          className="w-full font-black text-sm"
        >
          {spinning ? (
            <Loader2 className="size-5 animate-spin" />
          ) : spinCooldown > 0 ? (
            <span className="flex items-center gap-1.5 text-ludo-soft">
              <Clock className="size-4" /> انتظر {formatTimer(spinCooldown)} للدورة القادمة
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <RotateCcw className="size-4" /> تدوير العجلة مجاناً 🎰
            </span>
          )}
        </Button>
      </section>

      {/* الصندوق السريع كل 4 ساعات */}
      <section className="rounded-2xl border border-ludo-gold/30 bg-gradient-to-r from-[#310b2b] to-[#1a0418] p-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-ludo-gold/20 border border-ludo-gold/40 text-2xl">
            📦
          </div>
          <div className="min-w-0 text-right">
            <b className="block text-xs font-bold text-white truncate">
              صندوق الذهب السريع (250 عملة)
            </b>
            <span className="text-[10px] text-ludo-soft">
              {bonusCooldown > 0
                ? `متاح بعد: ${formatTimer(bonusCooldown)}`
                : "جاهز للاستلام الآن مجاناً!"}
            </span>
          </div>
        </div>

        <Button
          variant={bonusCooldown > 0 ? "ghostGold" : "neon"}
          size="sm"
          disabled={bonusCooldown > 0}
          onClick={() => void handleClaimBonus()}
          className="shrink-0 text-xs font-bold"
        >
          {bonusCooldown > 0 ? "انتظر" : "استلم الآن"}
        </Button>
      </section>

      {/* زر العودة */}
      <div className="pt-2">
        <Button variant="ghostGold" className="w-full" onClick={onBack}>
          العودة للرئيسية
        </Button>
      </div>
    </div>
  );
}
