import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/hooks/useAuth";

export type DailyRewardItem = {
  day: number;
  label: string;
  gold: number;
  diamonds: number;
  xp: number;
  icon: string;
  isSpecial?: boolean;
};

export const DAILY_REWARDS: DailyRewardItem[] = [
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

export type DailyRewardState = {
  currentStreak: number;
  hasClaimedToday: boolean;
  streakKey: string;
  lastClaimKey: string;
  msUntilMidnight: number;
};

/**
 * فحص حالة المكافأة اليومية للمستخدم الحالي أو الضيف
 */
export function getDailyRewardState(userId?: string | null): DailyRewardState {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  const msUntilMidnight = Math.max(0, midnight.getTime() - now.getTime());

  if (typeof window === "undefined") {
    return {
      currentStreak: 1,
      hasClaimedToday: false,
      streakKey: "ludo_daily_streak_guest",
      lastClaimKey: "ludo_daily_last_guest",
      msUntilMidnight,
    };
  }

  const streakKey = userId ? `ludo_daily_streak_${userId}` : "ludo_daily_streak_guest";
  const lastClaimKey = userId ? `ludo_daily_last_${userId}` : "ludo_daily_last_guest";

  const rawLast = localStorage.getItem(lastClaimKey);
  const rawStreak = localStorage.getItem(streakKey);
  let streak = rawStreak ? parseInt(rawStreak, 10) : 1;
  if (isNaN(streak) || streak < 1 || streak > 7) streak = 1;

  if (!rawLast) {
    return {
      currentStreak: streak,
      hasClaimedToday: false,
      streakKey,
      lastClaimKey,
      msUntilMidnight,
    };
  }

  const lastDate = new Date(rawLast);

  // التحقق هل استلم اليوم
  const isSameDay =
    lastDate.getFullYear() === now.getFullYear() &&
    lastDate.getMonth() === now.getMonth() &&
    lastDate.getDate() === now.getDate();

  if (isSameDay) {
    return {
      currentStreak: streak,
      hasClaimedToday: true,
      streakKey,
      lastClaimKey,
      msUntilMidnight,
    };
  }

  // حساب الفارق بالأيام التقويمية لمعرفة هل السلسلة متصلة
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfLast = new Date(
    lastDate.getFullYear(),
    lastDate.getMonth(),
    lastDate.getDate(),
  ).getTime();
  const diffDays = Math.round((startOfToday - startOfLast) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    // يوم متتالي: يكمل السلسلة
    return {
      currentStreak: streak,
      hasClaimedToday: false,
      streakKey,
      lastClaimKey,
      msUntilMidnight,
    };
  } else if (diffDays > 1) {
    // انقطعت السلسلة لأكثر من يوم، إعادة ضبط إلى اليوم الأول
    try {
      localStorage.setItem(streakKey, "1");
    } catch {
      /* ignore */
    }
    return {
      currentStreak: 1,
      hasClaimedToday: false,
      streakKey,
      lastClaimKey,
      msUntilMidnight,
    };
  }

  return {
    currentStreak: streak,
    hasClaimedToday: false,
    streakKey,
    lastClaimKey,
    msUntilMidnight,
  };
}

/**
 * تنفيذ استلام المكافأة اليومية
 */
export async function claimDailyRewardApi({
  user,
  profile,
  refreshProfile,
  updateProfileLocally,
}: {
  user: User | null;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  updateProfileLocally: (patch: Partial<Profile>) => void;
}): Promise<{ reward: DailyRewardItem; nextStreak: number }> {
  const { currentStreak, hasClaimedToday, streakKey, lastClaimKey } = getDailyRewardState(
    user?.id ?? null,
  );

  if (hasClaimedToday) {
    throw new Error("لقد استلمت مكافأة اليوم بالفعل!");
  }

  const reward = DAILY_REWARDS[currentStreak - 1] ?? DAILY_REWARDS[0];

  if (user && profile) {
    const newGold = (profile.gold ?? 0) + reward.gold;
    const newDiamonds = (profile.diamonds ?? 0) + reward.diamonds;
    const newXp = (profile.xp ?? 0) + reward.xp;

    updateProfileLocally({ gold: newGold, diamonds: newDiamonds, xp: newXp });

    const { error } = await supabase
      .from("profiles")
      .update({ gold: newGold, diamonds: newDiamonds, xp: newXp })
      .eq("id", user.id);

    if (error) {
      console.warn("Error updating profile in Supabase:", error);
    }
    await refreshProfile().catch(() => {});
  }

  const nowIso = new Date().toISOString();
  const nextStreak = currentStreak >= 7 ? 1 : currentStreak + 1;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(lastClaimKey, nowIso);
      localStorage.setItem(streakKey, nextStreak.toString());
      // إشارة للأجزاء الأخرى في الصفحة بالتحديث
      window.dispatchEvent(
        new CustomEvent("daily_reward_claimed", { detail: { reward, nextStreak } }),
      );
    } catch {
      /* ignore */
    }
  }

  return { reward, nextStreak };
}
