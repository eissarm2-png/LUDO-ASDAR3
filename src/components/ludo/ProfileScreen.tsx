import { useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  Camera,
  Check,
  ChevronLeft,
  Crown,
  Flame,
  Gem,
  Loader2,
  Medal,
  Pencil,
  Save,
  Shield,
  ShoppingBag,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Upload,
  User,
  Users,
  Wand2,
  X,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchChestOpenings, type OwnedItem } from "@/lib/economy.functions";
import { ITEM_KIND_LABEL, RarityChip, itemArt } from "./economy-visuals";
import { AVATAR_FRAMES, RARITY_LABELS, markAllFramesSeen } from "@/lib/avatar-frames";
import { AvatarFrame } from "./AvatarFrame";
import { AvatarGenerator } from "./AvatarGenerator";
import { cn } from "@/lib/utils";

const DEFAULT_EMOJI_AVATARS = ["🦁", "🐯", "🦅", "🐺", "🐲", "🦉", "🐧", "🐵", "👑", "⚡"];

export type RankInfo = {
  name: string;
  icon: string;
  minLevel: number;
  maxLevel: number;
  color: string;
  border: string;
  badgeBg: string;
  nextRankName?: string;
  nextRankMinLevel?: number;
};

export const RANKS: RankInfo[] = [
  {
    name: "مبتدئ",
    icon: "🥉",
    minLevel: 1,
    maxLevel: 4,
    color: "text-amber-500",
    border: "border-amber-500/50",
    badgeBg: "bg-amber-500/20",
    nextRankName: "هاوي",
    nextRankMinLevel: 5,
  },
  {
    name: "هاوي",
    icon: "🥈",
    minLevel: 5,
    maxLevel: 14,
    color: "text-slate-300",
    border: "border-slate-300/50",
    badgeBg: "bg-slate-300/20",
    nextRankName: "محترف",
    nextRankMinLevel: 15,
  },
  {
    name: "محترف",
    icon: "🥇",
    minLevel: 15,
    maxLevel: 29,
    color: "text-ludo-gold",
    border: "border-ludo-gold/60",
    badgeBg: "bg-ludo-gold/20",
    nextRankName: "بطل",
    nextRankMinLevel: 30,
  },
  {
    name: "بطل",
    icon: "🏆",
    minLevel: 30,
    maxLevel: 49,
    color: "text-cyan-400",
    border: "border-cyan-400/60",
    badgeBg: "bg-cyan-400/20",
    nextRankName: "أسطورة",
    nextRankMinLevel: 50,
  },
  {
    name: "أسطورة",
    icon: "👑",
    minLevel: 50,
    maxLevel: 999,
    color: "text-purple-400",
    border: "border-purple-400/60",
    badgeBg: "bg-purple-400/20",
  },
];

export function getRank(level: number): RankInfo {
  const rank = RANKS.find((r) => level >= r.minLevel && level <= r.maxLevel);
  return rank ?? RANKS[0];
}

export type BadgeItem = {
  id: string;
  name: string;
  desc: string;
  icon: string;
  color: string;
  bg: string;
  unlocked: boolean;
};

function StatBox({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="glossy-card flex flex-col items-center justify-center p-2.5 text-center min-w-0">
      <small className="text-[11px] font-medium text-ludo-soft truncate w-full">{label}</small>
      <b className="text-lg font-black text-ludo-gold truncate w-full tracking-wide">{value}</b>
      {sub && <span className="text-[9px] text-ludo-soft/80 truncate">{sub}</span>}
    </div>
  );
}

export function ProfileScreen({
  onHistory,
  onGoToStore,
}: {
  onHistory: () => void;
  onGoToStore?: () => void;
}) {
  const { user, profile, refreshProfile, updateProfileLocally } = useAuth();
  const loadItems = useServerFn(fetchChestOpenings);
  const [items, setItems] = useState<OwnedItem[]>([]);
  const [editing, setEditing] = useState(false);
  const [showAvatarGenerator, setShowAvatarGenerator] = useState(false);
  const [name, setName] = useState(profile?.display_name ?? "");
  const [avatar, setAvatar] = useState(profile?.avatar ?? "🦁");
  const [selectedFrame, setSelectedFrame] = useState(profile?.frame || "frame_default");
  const [saving, setSaving] = useState(false);
  const [equippingFrame, setEquippingFrame] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [topRivals, setTopRivals] = useState<
    Array<{ id: string; display_name: string; avatar: string; points: number; wins: number }>
  >([]);
  const [loadingRivals, setLoadingRivals] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(profile?.display_name ?? "");
    setAvatar(profile?.avatar || "🦁");
    setSelectedFrame(profile?.frame || "frame_default");
  }, [profile?.display_name, profile?.avatar, profile?.frame]);

  // قائمة الإطارات المملوكة
  const ownedFrameCodes = useMemo(() => {
    const set = new Set<string>(["frame_default"]);
    if (profile?.frame) set.add(profile.frame);
    items.filter((i) => i.kind === "frame").forEach((i) => set.add(i.code));

    try {
      const raw = localStorage.getItem("ludo_local_owned_frames");
      if (raw) {
        const list: string[] = JSON.parse(raw);
        list.forEach((c) => set.add(c));
      }
    } catch {
      // ignore
    }
    return set;
  }, [profile?.frame, items]);

  // Load owned items
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let alive = true;
    void loadItems({})
      .then((res) => {
        if (alive) setItems(res.items ?? []);
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [loadItems, user]);

  // Load comparison rivals from leaderboard / profiles
  useEffect(() => {
    let alive = true;
    void supabase
      .from("profiles")
      .select("id, display_name, avatar, points, wins")
      .order("points", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (alive && data) {
          setTopRivals(data);
        }
      })
      .finally(() => {
        if (alive) setLoadingRivals(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!user || !profile) {
    return (
      <div className="glossy-card p-6 text-center space-y-3">
        <Crown className="size-12 mx-auto text-ludo-gold/70" />
        <p className="text-sm font-bold text-ludo-soft">
          سجّل الدخول لعرض وتعديل ملفك الشخصي وشاراتك ورتبتك.
        </p>
      </div>
    );
  }

  const level = profile.level || 1;
  const rank = getRank(level);
  const winRate = profile.games ? Math.round((profile.wins / profile.games) * 100) : 0;
  const levelXp = (profile.xp ?? 0) % 300;
  const xpNeededForNextLevel = 300 - levelXp;

  // Calculate XP remaining to reach next rank
  let xpRemainingForNextRank = 0;
  if (rank.nextRankMinLevel) {
    const levelsNeeded = rank.nextRankMinLevel - level;
    if (levelsNeeded > 0) {
      xpRemainingForNextRank = (levelsNeeded - 1) * 300 + xpNeededForNextLevel;
    }
  }

  // Badges calculation
  const badges: BadgeItem[] = [
    {
      id: "top-player",
      name: "أفضل لاعب",
      desc: "نسبة فوز تتجاوز 50% مع 3 مباريات على الأقل",
      icon: "👑",
      color: "text-ludo-gold",
      bg: "bg-ludo-gold/20 border-ludo-gold/50",
      unlocked: winRate >= 50 && profile.games >= 3,
    },
    {
      id: "veteran",
      name: "مخضرم",
      desc: "خوض أكثر من 15 مباراة في عقور لدو",
      icon: "⚔️",
      color: "text-amber-400",
      bg: "bg-amber-400/20 border-amber-400/50",
      unlocked: profile.games >= 15 || level >= 5,
    },
    {
      id: "gem-hunter",
      name: "صائد الجواهر",
      desc: "جمع أكثر من 50 ماسة أو 500 نقطة",
      icon: "💎",
      color: "text-cyan-400",
      bg: "bg-cyan-400/20 border-cyan-400/50",
      unlocked: (profile.diamonds ?? 0) >= 50 || profile.points >= 500,
    },
    {
      id: "dice-master",
      name: "قاهر النرد",
      desc: "تحقيق 5 انتصارات ساحقة على الأقل",
      icon: "🎲",
      color: "text-rose-400",
      bg: "bg-rose-400/20 border-rose-400/50",
      unlocked: profile.wins >= 5,
    },
    {
      id: "rising-star",
      name: "نجم صاعد",
      desc: "بدء أولى المعارك وخوض مباراة واحدة",
      icon: "🌟",
      color: "text-emerald-400",
      bg: "bg-emerald-400/20 border-emerald-400/50",
      unlocked: profile.games >= 1,
    },
    {
      id: "club-champion",
      name: "سيد الصقور",
      desc: "بلوغ المستوى 10 أو تحقيق 1000 نقطة",
      icon: "🦅",
      color: "text-purple-400",
      bg: "bg-purple-400/20 border-purple-400/50",
      unlocked: level >= 10 || profile.points >= 1000,
    },
  ];

  const unlockedBadges = badges.filter((b) => b.unlocked);

  // Handle local image file upload & compression
  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار ملف صورة صالح");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 5 ميجابايت");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          const dataUrl = canvas.toDataURL("image/webp", 0.85);
          setAvatar(dataUrl);
          toast.success("تم تحديد صورتك الشخصية! اضغط 'حفظ' لتطبيق التغييرات.");
        }
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    const clean = name.trim().slice(0, 40);
    if (clean.length < 2) {
      toast.error("الاسم قصير جدًا (حرفين على الأقل)");
      return;
    }
    setSaving(true);
    updateProfileLocally({ display_name: clean, avatar, frame: selectedFrame });
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: clean, avatar, frame: selectedFrame })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("تعذّر حفظ الملف، حاول مرة أخرى");
      return;
    }
    toast.success("تم تحديث الملف الشخصي والصورة والإطار بنجاح! 👑");
    setEditing(false);
    await refreshProfile();
  };

  const renderAvatarContent = (av: string) => {
    if (av.startsWith("data:") || av.startsWith("http")) {
      return <img src={av} alt="الصورة الشخصية" className="size-full rounded-full object-cover" />;
    }
    return <span className="text-3xl select-none">{av || "🦁"}</span>;
  };

  // Find user's comparison rank
  const myRankIndex = topRivals.findIndex((r) => r.id === user.id);
  const myRankNumber = myRankIndex >= 0 ? myRankIndex + 1 : "> 10";

  return (
    <div className="space-y-4 pb-8" dir="rtl">
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileSelect}
        accept="image/*"
        className="hidden"
      />

      {/* بطاقة الملف الشخصي والرتبة والشارات */}
      <section className="relative overflow-hidden rounded-2xl border-2 border-ludo-gold/60 bg-gradient-to-b from-[#401138] via-[#240822] to-[#120310] p-4 shadow-[0_10px_25px_rgba(0,0,0,0.6)]">
        {/* شريط الشارات الرسومية المكتسبة فوق اسم المستخدم */}
        {unlockedBadges.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-1.5 border-b border-ludo-gold/20 pb-2.5">
            <span className="text-[11px] font-bold text-ludo-gold/90 flex items-center gap-1 shrink-0">
              <Sparkles className="size-3.5 text-ludo-gold" /> الشارات:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {unlockedBadges.map((b) => (
                <span
                  key={b.id}
                  title={b.desc}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black shadow-sm transition hover:scale-105",
                    b.bg,
                    b.color,
                  )}
                >
                  <span>{b.icon}</span>
                  <span>{b.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3.5">
          {/* دائرة الصورة الشخصية مع إطارها المختار وزر التغيير والرفع */}
          <div className="relative group shrink-0">
            <AvatarFrame
              frameId={profile.frame}
              avatar={profile.avatar || "🦁"}
              size="xl"
              showBadge
            />

            <button
              type="button"
              onClick={() => {
                setEditing(true);
                fileInputRef.current?.click();
              }}
              title="تغيير الصورة من جهازك"
              className="absolute -bottom-1 -left-1 z-10 grid size-7 place-items-center rounded-full border border-ludo-gold bg-[#8d2a72] text-white shadow-md transition hover:scale-110 active:scale-95"
            >
              <Camera className="size-3.5" />
            </button>
          </div>

          {/* تفاصيل الاسم والرتبة ومؤشر المستوى */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <b className="truncate text-xl font-black text-ludo-gold drop-shadow">
                {profile.display_name}
              </b>
              <button
                type="button"
                onClick={() => setEditing((prev) => !prev)}
                className="flex items-center gap-1 rounded-lg border border-ludo-gold/30 bg-black/40 px-2 py-1 text-xs font-bold text-ludo-soft hover:text-white transition active:scale-95"
              >
                <Pencil className="size-3" /> تعديل
              </button>
            </div>

            {/* بادج الرتبة التلقائي مع الأيقونة واللون */}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold shadow-sm",
                  rank.badgeBg,
                  rank.border,
                  rank.color,
                )}
              >
                <span className="text-sm">{rank.icon}</span>
                <span>الرتبة: {rank.name}</span>
              </div>
              <span className="text-xs font-bold text-ludo-soft">المستوى {level}</span>
            </div>

            {/* شريط خبرة المستوى الحالي */}
            <div className="space-y-0.5 pt-1">
              <div className="h-2 w-full overflow-hidden rounded-full border border-ludo-gold/30 bg-black/60">
                <span
                  className="block h-full bg-gradient-to-r from-ludo-gold via-amber-400 to-yellow-300 transition-all duration-500"
                  style={{ width: `${Math.min(100, (levelXp / 300) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-semibold text-ludo-soft">
                <span>{levelXp} / 300 خبرة (المستوى الحالى)</span>
                <span className="text-ludo-gold/90">{xpNeededForNextLevel} XP للمستوى التالي</span>
              </div>
            </div>
          </div>
        </div>

        {/* بطاقة توضيح الرتبة القادمة والخبرة المتبقية */}
        {rank.nextRankName && (
          <div className="mt-3 rounded-xl border border-ludo-gold/30 bg-black/40 p-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Target className="size-4 text-ludo-gold shrink-0" />
              <div className="min-w-0 text-right">
                <p className="text-xs font-bold text-white truncate">
                  الرتبة التالية: <span className="text-ludo-gold">{rank.nextRankName}</span>
                </p>
                <p className="text-[10px] text-ludo-soft truncate">
                  متبقي {xpRemainingForNextRank.toLocaleString("ar-EG")} نقطة خبرة (XP) للترقية
                </p>
              </div>
            </div>
            <span className="rounded-full bg-ludo-gold/20 border border-ludo-gold/40 px-2 py-0.5 text-[11px] font-black text-ludo-gold shrink-0">
              المستوى {rank.nextRankMinLevel}
            </span>
          </div>
        )}
      </section>

      {/* لوحة تعديل الملف الشخصي والصورة الشخصية (تظهر عند الضغط على تعديل) */}
      {editing && (
        <section className="glossy-card space-y-3 p-4 border border-ludo-gold/60 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-ludo-gold/20 pb-2">
            <h4 className="text-sm font-black text-ludo-gold flex items-center gap-1.5">
              <Pencil className="size-4" /> تعديل اسمك وصورتك الشخصية
            </h4>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-ludo-soft hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ludo-soft">اسم اللاعب:</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اسم اللاعب الجديد"
              maxLength={40}
              className="text-right font-bold text-white border-ludo-gold/40 bg-black/50"
            />
          </div>

          {/* خيار رفع صورة من الجهاز */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ludo-soft">الصورة الشخصية:</label>
            <div className="flex items-center gap-3">
              <div className="grid size-14 shrink-0 place-items-center rounded-full border-2 border-ludo-gold bg-black/60 overflow-hidden">
                {renderAvatarContent(avatar)}
              </div>
              <Button
                type="button"
                variant="royal"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 text-xs"
              >
                <Upload className="size-4" /> رفع صورة من جهازك
              </Button>
            </div>
          </div>

          {/* صانع ومُولّد الشخصيات المخصص */}
          <div className="pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAvatarGenerator((v) => !v)}
              className="w-full flex items-center justify-center gap-2 text-xs font-bold border-amber-400/50 bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-pink-500/20 text-ludo-gold hover:text-white"
            >
              <Wand2 className="size-4 text-amber-300 animate-pulse" />
              {showAvatarGenerator
                ? "إغلاق صانع الشخصيات"
                : "صمّم شخصيتك المخصصة (ألوان، عيون، تعابير) 🎨"}
            </Button>
          </div>

          {showAvatarGenerator && (
            <div className="rounded-xl border border-amber-400/40 bg-black/40 p-2">
              <AvatarGenerator
                currentFrame={selectedFrame}
                onSelectAvatar={(val) => {
                  setAvatar(val);
                  setShowAvatarGenerator(false);
                  toast.success("تم تطبيق شخصيتك الجديدة! اضغط حفظ التغييرات لتأكيدها");
                }}
                onClose={() => setShowAvatarGenerator(false)}
              />
            </div>
          )}

          {/* أو الاختيار من الأيقونات الجاهزة */}
          <div className="space-y-1">
            <span className="text-[11px] text-ludo-soft">أو اختر رمزاً تعبيرياً سريعاً:</span>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_EMOJI_AVATARS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvatar(a)}
                  className={cn(
                    "grid size-9 place-items-center rounded-xl border text-lg transition active:scale-95",
                    avatar === a
                      ? "border-ludo-gold bg-ludo-gold/30 shadow-md scale-105"
                      : "border-ludo-gold/20 bg-black/30 hover:border-ludo-gold/50",
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button variant="ghostGold" onClick={() => setEditing(false)}>
              إلغاء
            </Button>
            <Button variant="play" disabled={saving} onClick={() => void save()}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}{" "}
              حفظ التغييرات
            </Button>
          </div>
        </section>
      )}

      {/* بطاقات الرصيد المالي (الذهب والماس) */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="glossy-card flex items-center justify-center gap-2 p-3 font-black text-ludo-gold shadow-md">
          <span className="text-xl">🪙</span>
          <div className="text-right">
            <small className="block text-[10px] text-ludo-soft">الذهب المتوفر</small>
            <span className="text-base tracking-wider">{profile.gold.toLocaleString("ar-EG")}</span>
          </div>
        </div>
        <div className="glossy-card flex items-center justify-center gap-2 p-3 font-black text-cyan-400 shadow-md">
          <span className="text-xl">💎</span>
          <div className="text-right">
            <small className="block text-[10px] text-ludo-soft">الماس المتوفر</small>
            <span className="text-base tracking-wider">
              {profile.diamonds.toLocaleString("ar-EG")}
            </span>
          </div>
        </div>
      </div>

      {/* إحصائيات المعارك واللعب - منظمة بدون أي انضغاط */}
      <div className="grid grid-cols-3 gap-2">
        <StatBox label="الانتصارات" value={profile.wins} sub="فوز مستحق" />
        <StatBox label="المباريات" value={profile.games} sub="مباراة كاملة" />
        <StatBox label="نسبة الفوز" value={`${winRate}%`} sub="معدل النجاح" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatBox
          label="إجمالي النقاط"
          value={profile.points.toLocaleString("ar-EG")}
          sub="نقاط الترتيب"
        />
        <StatBox label="الخسائر" value={profile.losses} sub="مباريات خاسرة" />
      </div>

      {/* قسم إطارات الأيقونة الشخصية */}
      <section className="rounded-2xl border border-ludo-gold/40 bg-gradient-to-b from-[#2e092b] to-[#150214] p-3.5 space-y-3">
        <div className="flex items-center justify-between border-b border-ludo-gold/20 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-ludo-gold" />
            <h4 className="text-sm font-black text-ludo-gold">
              إطارات الأيقونة الشخصية (خزانة الإطارات)
            </h4>
          </div>
          {onGoToStore && (
            <Button
              size="sm"
              variant="ghostGold"
              onClick={onGoToStore}
              className="h-7 text-[11px] gap-1 px-2.5 text-ludo-gold hover:text-white"
            >
              <ShoppingBag className="size-3" /> متجر الإطارات
            </Button>
          )}
        </div>

        <p className="text-[11px] text-ludo-soft">
          اختر إطاراً لتزيين صورتك الشخصية والظهور بمظهر ملكي أثناء اللعب وفي قوائم الصدارة:
        </p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {AVATAR_FRAMES.map((f) => {
            const isEquipped = (profile?.frame || "frame_default") === f.code;
            const isOwned = ownedFrameCodes.has(f.code);
            const rarity = RARITY_LABELS[f.rarity] || RARITY_LABELS.common;

            return (
              <div
                key={f.code}
                className={cn(
                  "relative flex flex-col items-center justify-between rounded-xl border p-2.5 text-center transition",
                  isEquipped
                    ? "border-amber-400 bg-amber-500/15 shadow-[0_0_12px_rgba(251,191,36,0.25)]"
                    : isOwned
                      ? "border-ludo-gold/40 bg-black/30 hover:border-ludo-gold/70"
                      : "border-white/10 bg-black/40 opacity-75 hover:opacity-100",
                )}
              >
                <span
                  className={cn(
                    "self-start mb-1 rounded-full border px-1.5 py-0.5 text-[8px] font-black uppercase",
                    rarity.bg,
                    rarity.color,
                  )}
                >
                  {rarity.label}
                </span>

                <div className="my-2">
                  <AvatarFrame
                    frameId={f.code}
                    avatar={profile?.avatar || "🦁"}
                    size="md"
                    showBadge
                  />
                </div>

                <b className="truncate text-xs font-bold text-white w-full">{f.title}</b>
                <p className="line-clamp-1 text-[9px] text-ludo-soft/70 mb-2">{f.description}</p>

                {isEquipped ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-300 py-1">
                    <Check className="size-3" /> مُفعّل حالياً
                  </span>
                ) : isOwned ? (
                  <Button
                    size="sm"
                    variant="royal"
                    disabled={equippingFrame === f.code}
                    onClick={async () => {
                      setEquippingFrame(f.code);
                      try {
                        updateProfileLocally({ frame: f.code });
                        if (user?.id) {
                          await supabase
                            .from("profiles")
                            .update({ frame: f.code })
                            .eq("id", user.id);
                        }
                        toast.success(`تم تفعيل ${f.title} بنجاح! ✨`);
                        await refreshProfile();
                      } catch {
                        toast.error("تعذّر تفعيل الإطار");
                      } finally {
                        setEquippingFrame(null);
                      }
                    }}
                    className="h-7 w-full text-[10px] font-bold"
                  >
                    تفعيل الإطار
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onGoToStore}
                    className="h-7 w-full border-ludo-gold/40 text-[10px] font-bold text-ludo-gold hover:bg-ludo-gold/20"
                  >
                    {f.cost_diamonds > 0
                      ? `${f.cost_diamonds} 💎 بالمتجر`
                      : `${f.cost_gold.toLocaleString()} 🪙 بالمتجر`}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* قسم الشارات والأوسمة (الإنجازات) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-sm font-black text-ludo-gold flex items-center gap-1.5">
            <Medal className="size-4 text-ludo-gold" /> شارات الإنجاز والأوسمة
          </h4>
          <span className="rounded-full bg-ludo-gold/15 border border-ludo-gold/30 px-2 py-0.5 text-[10px] font-bold text-ludo-gold">
            {unlockedBadges.length} من {badges.length} مكتملة
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {badges.map((b) => (
            <div
              key={b.id}
              className={cn(
                "relative overflow-hidden rounded-xl border p-2.5 flex items-start gap-2.5 transition",
                b.unlocked
                  ? "border-ludo-gold/60 bg-gradient-to-br from-[#4d1443] to-[#20041d] shadow-sm"
                  : "border-white/10 bg-black/40 opacity-60 grayscale-[40%]",
              )}
            >
              <span className="text-2xl shrink-0 mt-0.5">{b.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <b className={cn("text-xs truncate", b.unlocked ? b.color : "text-slate-400")}>
                    {b.name}
                  </b>
                  {b.unlocked && (
                    <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-0.5 shrink-0">
                      <Check className="size-3" /> مفتوحة
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-ludo-soft line-clamp-2 mt-0.5 leading-tight">
                  {b.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* قسم المقارنة مع الأصدقاء والمنافسين */}
      <section className="rounded-2xl border border-ludo-gold/40 bg-gradient-to-b from-[#2e092b] to-[#150214] p-3.5 space-y-3">
        <div className="flex items-center justify-between border-b border-ludo-gold/20 pb-2">
          <h4 className="text-sm font-black text-ludo-gold flex items-center gap-1.5">
            <Users className="size-4 text-ludo-gold" /> مقارنة الأداء والمنافسين
          </h4>
          <span className="text-[11px] font-bold text-ludo-soft">
            ترتيبك الحالي: <b className="text-ludo-gold font-black">#{myRankNumber}</b>
          </span>
        </div>

        {loadingRivals ? (
          <div className="grid place-items-center py-4 text-ludo-gold">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] text-ludo-soft">
              مقارنة نقاطك وانتصاراتك مع نخبة اللاعبين والأصدقاء في عقور لدو:
            </p>

            <div className="divide-y divide-white/10 rounded-xl border border-ludo-gold/25 bg-black/40 overflow-hidden">
              {/* بطاقتك أنت */}
              <div className="flex items-center justify-between gap-2 p-2.5 bg-ludo-gold/15 border-r-4 border-ludo-gold">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="grid size-7 shrink-0 place-items-center rounded-full border border-ludo-gold bg-[#681954] text-xs">
                    {renderAvatarContent(profile.avatar || "🦁")}
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-black text-ludo-gold truncate">
                      {profile.display_name} (أنت)
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">
                      {rank.icon} {rank.name}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-left shrink-0">
                  <div>
                    <small className="block text-[9px] text-ludo-soft">النقاط</small>
                    <b className="text-xs text-white">{profile.points}</b>
                  </div>
                  <div>
                    <small className="block text-[9px] text-ludo-soft">فوز</small>
                    <b className="text-xs text-ludo-gold">{profile.wins}</b>
                  </div>
                </div>
              </div>

              {/* منافسين / أصدقاء */}
              {topRivals
                .filter((r) => r.id !== user.id)
                .slice(0, 4)
                .map((rival, index) => (
                  <div
                    key={rival.id}
                    className="flex items-center justify-between gap-2 p-2 hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[11px] font-bold text-ludo-soft w-4 text-center">
                        #{index + 1}
                      </span>
                      <div className="grid size-7 shrink-0 place-items-center rounded-full border border-white/20 bg-black/50 text-xs">
                        {renderAvatarContent(rival.avatar || "👑")}
                      </div>
                      <span className="truncate text-xs font-bold text-slate-200">
                        {rival.display_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-left shrink-0">
                      <div>
                        <b className="text-xs text-slate-300">{rival.points} نقطة</b>
                      </div>
                      <div>
                        <span className="text-[11px] text-ludo-soft">{rival.wins} فوز</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </section>

      {/* العناصر المملوكة */}
      <section className="space-y-2">
        <h4 className="text-center text-sm font-bold text-ludo-gold">العناصر والمعدات المملوكة</h4>
        {loading ? (
          <div className="grid place-items-center py-6 text-ludo-gold">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <p className="glossy-card text-center text-xs text-ludo-soft py-4">
            لا عناصر بعد — افتح صندوقاً أو زر المتجر للحصول على معدات نادرة.
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {items.slice(0, 12).map((it) => (
              <article
                key={it.id}
                className="glossy-card grid place-items-center gap-1 p-2 text-center"
              >
                <img
                  src={itemArt(it.kind)}
                  alt=""
                  width={512}
                  height={512}
                  loading="lazy"
                  className="relative size-10"
                />
                <small className="relative text-[9px] text-ludo-soft truncate w-full">
                  {ITEM_KIND_LABEL[it.kind]}
                </small>
                <span className="relative">
                  <RarityChip rarity={it.rarity} />
                </span>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* أزرار السجل والتحكم */}
      <div className="grid gap-2 pt-2">
        <Button variant="ghostGold" className="w-full" onClick={onHistory}>
          سجل المباريات والتفاصيل
        </Button>
      </div>
    </div>
  );
}
