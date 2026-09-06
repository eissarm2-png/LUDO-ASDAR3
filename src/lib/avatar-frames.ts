export type FrameRarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export type AvatarFrameDef = {
  id: string;
  code: string;
  title: string;
  description: string;
  rarity: FrameRarity;
  cost_gold: number;
  cost_diamonds: number;
  borderClass: string;
  gradient: string;
  glowStyle: string;
  accentHex: string;
  badgeIcon?: string;
  animationClass?: string;
  isDefault?: boolean;
};

export const AVATAR_FRAMES: AvatarFrameDef[] = [
  {
    id: "frame_default",
    code: "frame_default",
    title: "إطار المبتدئ الكلاسيكي",
    description: "الإطار البرونزي الكلاسيكي لجميع رواد لودو عبقور",
    rarity: "common",
    cost_gold: 0,
    cost_diamonds: 0,
    borderClass: "border-2 border-amber-500/70",
    gradient: "from-amber-700/20 via-black/40 to-amber-900/30",
    glowStyle: "0 0 8px rgba(217, 119, 6, 0.4)",
    accentHex: "#d97706",
    badgeIcon: "🛡️",
    isDefault: true,
  },
  {
    id: "frame_gold_royal",
    code: "frame_gold_royal",
    title: "التاج الملكي المذهب",
    description: "إطار ذهبي خالص عيار 24 مع وهج ملكي فاخر وتاج المجد",
    rarity: "legendary",
    cost_gold: 5000,
    cost_diamonds: 0,
    borderClass: "border-[3px] border-yellow-300",
    gradient: "from-yellow-400/40 via-amber-600/30 to-yellow-200/40",
    glowStyle: "0 0 16px rgba(253, 224, 71, 0.7), inset 0 0 8px rgba(251, 191, 36, 0.5)",
    accentHex: "#fde047",
    badgeIcon: "👑",
    animationClass: "animate-pulse",
  },
  {
    id: "frame_neon_cyber",
    code: "frame_neon_cyber",
    title: "السايبر بانك المتوهج",
    description: "إطار تكنولوجي مستقبلي بلون سماوي نيون وخطوط طاقة متلألئة",
    rarity: "epic",
    cost_gold: 3500,
    cost_diamonds: 25,
    borderClass: "border-[3px] border-cyan-400",
    gradient: "from-cyan-500/40 via-blue-900/40 to-teal-400/40",
    glowStyle: "0 0 18px rgba(6, 182, 212, 0.8), inset 0 0 10px rgba(34, 211, 238, 0.5)",
    accentHex: "#22d3ee",
    badgeIcon: "⚡",
  },
  {
    id: "frame_dragon_fire",
    code: "frame_dragon_fire",
    title: "لهيب التنين الأسطوري",
    description: "إطار بركاني ثائر بحواف لهب أحمر متقد وشرارات حرارية",
    rarity: "mythic",
    cost_gold: 8000,
    cost_diamonds: 50,
    borderClass: "border-[3px] border-orange-500",
    gradient: "from-red-600/40 via-orange-600/30 to-amber-500/40",
    glowStyle: "0 0 20px rgba(239, 68, 68, 0.85), inset 0 0 10px rgba(249, 115, 22, 0.6)",
    accentHex: "#f97316",
    badgeIcon: "🔥",
    animationClass: "animate-pulse",
  },
  {
    id: "frame_amethyst_violet",
    code: "frame_amethyst_violet",
    title: "الجمشت الإمبراطوري",
    description: "إطار بلوري بنفسجي باهر مستوحى من أحجار الجمشت النادرة",
    rarity: "epic",
    cost_gold: 4000,
    cost_diamonds: 30,
    borderClass: "border-[3px] border-purple-400",
    gradient: "from-purple-600/40 via-fuchsia-900/40 to-pink-500/30",
    glowStyle: "0 0 16px rgba(192, 132, 252, 0.75), inset 0 0 8px rgba(217, 70, 239, 0.5)",
    accentHex: "#c084fc",
    badgeIcon: "💎",
  },
  {
    id: "frame_frost_ice",
    code: "frame_frost_ice",
    title: "الصقيع الأزرق السرمدي",
    description: "بلورات جليد قطبية متجمدة تشع نقاءً وهيبة على رقعة اللعب",
    rarity: "rare",
    cost_gold: 2500,
    cost_diamonds: 15,
    borderClass: "border-[2.5px] border-sky-300",
    gradient: "from-sky-400/30 via-slate-900/40 to-blue-300/30",
    glowStyle: "0 0 14px rgba(125, 211, 252, 0.7)",
    accentHex: "#7dd3fc",
    badgeIcon: "❄️",
  },
  {
    id: "frame_emerald_champion",
    code: "frame_emerald_champion",
    title: "الزمرد الفاخر",
    description: "إطار أخضر زمردي إمبراطوري مع لمسات ذهبية للأبطال المحترفين",
    rarity: "epic",
    cost_gold: 4500,
    cost_diamonds: 35,
    borderClass: "border-[3px] border-emerald-400",
    gradient: "from-emerald-600/40 via-green-950/50 to-teal-400/30",
    glowStyle: "0 0 16px rgba(52, 211, 153, 0.75), inset 0 0 8px rgba(16, 185, 129, 0.5)",
    accentHex: "#34d399",
    badgeIcon: "🍀",
  },
  {
    id: "frame_cosmic_galaxy",
    code: "frame_cosmic_galaxy",
    title: "المجرة الكونية الساطعة",
    description: "إطار سديمي عميق محاط بنجوم وضاءة من أعماق الفضاء الخارجي",
    rarity: "mythic",
    cost_gold: 10000,
    cost_diamonds: 75,
    borderClass: "border-[3px] border-indigo-400",
    gradient: "from-indigo-600/40 via-purple-900/50 to-pink-600/40",
    glowStyle: "0 0 22px rgba(129, 140, 248, 0.85), inset 0 0 12px rgba(192, 132, 252, 0.6)",
    accentHex: "#818cf8",
    badgeIcon: "✨",
    animationClass: "animate-pulse",
  },
  {
    id: "frame_ruby_glory",
    code: "frame_ruby_glory",
    title: "الياقوت القرمزي",
    description: "إطار ياقوتي مشع يرمز للشجاعة والنصر الحاسم في الجولات",
    rarity: "legendary",
    cost_gold: 6500,
    cost_diamonds: 45,
    borderClass: "border-[3px] border-rose-500",
    gradient: "from-rose-600/40 via-red-950/50 to-amber-600/30",
    glowStyle: "0 0 18px rgba(244, 63, 94, 0.8), inset 0 0 10px rgba(225, 29, 72, 0.5)",
    accentHex: "#f43f5e",
    badgeIcon: "🩸",
  },
  {
    id: "frame_rainbow_pride",
    code: "frame_rainbow_pride",
    title: "طيف النصر الخارق",
    description: "تدرج لوني ساحر يجمع كل ألوان الطيف باحتفالية دائمة",
    rarity: "mythic",
    cost_gold: 12000,
    cost_diamonds: 100,
    borderClass: "border-[3px] border-fuchsia-400",
    gradient: "from-red-500/30 via-yellow-500/30 to-blue-500/30",
    glowStyle: "0 0 24px rgba(236, 72, 153, 0.85), inset 0 0 12px rgba(59, 130, 246, 0.5)",
    accentHex: "#ec4899",
    badgeIcon: "🌈",
    animationClass: "animate-pulse",
  },
];

export const RARITY_LABELS: Record<FrameRarity, { label: string; color: string; bg: string }> = {
  common: { label: "عادي", color: "text-slate-300", bg: "bg-slate-700/60 border-slate-500/50" },
  rare: { label: "نادر", color: "text-sky-300", bg: "bg-sky-900/60 border-sky-400/50" },
  epic: { label: "ملحمي", color: "text-purple-300", bg: "bg-purple-900/60 border-purple-400/50" },
  legendary: {
    label: "أسطوري",
    color: "text-yellow-300",
    bg: "bg-amber-900/60 border-yellow-400/50",
  },
  mythic: { label: "خارق", color: "text-rose-300", bg: "bg-rose-900/60 border-rose-500/50" },
};

export function getFrameById(id?: string | null): AvatarFrameDef {
  if (!id) return AVATAR_FRAMES[0];
  const found = AVATAR_FRAMES.find((f) => f.id === id || f.code === id);
  return found ?? AVATAR_FRAMES[0];
}

const SEEN_FRAMES_KEY = "ludo_seen_store_frames_v1";

export function getUnseenStoreFramesCount(ownedCodes: Set<string>): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(SEEN_FRAMES_KEY);
    const seen = new Set<string>(raw ? JSON.parse(raw) : []);
    const available = AVATAR_FRAMES.filter((f) => !f.isDefault && !ownedCodes.has(f.code));
    const unseen = available.filter((f) => !seen.has(f.code));
    return unseen.length;
  } catch {
    return 0;
  }
}

export function markAllFramesSeen() {
  if (typeof window === "undefined") return;
  try {
    const allCodes = AVATAR_FRAMES.map((f) => f.code);
    localStorage.setItem(SEEN_FRAMES_KEY, JSON.stringify(allCodes));
  } catch {
    // ignore
  }
}
