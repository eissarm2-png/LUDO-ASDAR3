import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Crown,
  Flame,
  Medal,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { sfx } from "@/lib/audio";
import { cn } from "@/lib/utils";

export type Tournament = {
  id: string;
  name: string;
  desc: string;
  prizeGold: number;
  prizeDiamonds: number;
  entryFee: number;
  maxPlayers: number;
  registeredCount: number;
  timeRemaining: string;
  status: "live" | "open" | "starting_soon";
  icon: string;
  speedSec: number;
  modeLabel: string;
};

const TOURNAMENTS: Tournament[] = [
  {
    id: "falcons-grand",
    name: "بطولة صقور الكبرى",
    desc: "أكبر بطولة رسمية لهذا الأسبوع بمشاركة أفضل أبطال الوطن العربي",
    prizeGold: 50000,
    prizeDiamonds: 200,
    entryFee: 500,
    maxPlayers: 16,
    registeredCount: 14,
    timeRemaining: "يومان و 8 ساعات",
    status: "live",
    icon: "🦅",
    speedSec: 10,
    modeLabel: "4 لاعبين - إقصاء مباشر",
  },
  {
    id: "blitz-cup",
    name: "بطولة السرعة الخاطفة",
    desc: "سرعة فائقة وتركيز حاسم! 7 ثوانٍ فقط لكل رمية نرد",
    prizeGold: 20000,
    prizeDiamonds: 50,
    entryFee: 250,
    maxPlayers: 8,
    registeredCount: 7,
    timeRemaining: "35 دقيقة متبقية",
    status: "starting_soon",
    icon: "⚡",
    speedSec: 7,
    modeLabel: "سرعة نفاثة - وقت رمي 7ث",
  },
  {
    id: "knights-duel",
    name: "تحدي الفرسان 1 ضد 1",
    desc: "معركة رأس برأس بدون أي تساهل - الفائز يحصد الذهب بالكامل",
    prizeGold: 10000,
    prizeDiamonds: 30,
    entryFee: 150,
    maxPlayers: 2,
    registeredCount: 1,
    timeRemaining: "متاح للانضمام الفوري",
    status: "open",
    icon: "⚔️",
    speedSec: 12,
    modeLabel: "مباراة 1v1 حاسمة",
  },
  {
    id: "legends-weekly",
    name: "كأس الأساطير الأسبوعي",
    desc: "دوري النخبة الشامل للحصول على شارات الأساطير والدرع الذهبي",
    prizeGold: 100000,
    prizeDiamonds: 500,
    entryFee: 1000,
    maxPlayers: 32,
    registeredCount: 26,
    timeRemaining: "5 أيام متبقية",
    status: "open",
    icon: "👑",
    speedSec: 10,
    modeLabel: "تصفيات خروج المغلوب",
  },
];

export function TournamentsScreen({
  onBack,
  onStartTournamentMatch,
}: {
  onBack: () => void;
  onStartTournamentMatch?: (t: Tournament) => void;
}) {
  const { user, profile, refreshProfile } = useAuth();
  const [selectedTourney, setSelectedTourney] = useState<Tournament | null>(null);
  const [registeredIds, setRegisteredIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("ludo_registered_tournaments");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [registering, setRegistering] = useState(false);

  const handleRegister = async (t: Tournament) => {
    if (registeredIds.includes(t.id)) {
      toast.info("أنت مسجل بالفعل في هذه البطولة! استعد لبدء الجولة 🏆");
      return;
    }

    const currentGold = profile?.gold ?? 0;
    if (currentGold < t.entryFee) {
      toast.error(`رصيدك الذهبي غير كافٍ! رسوم الدخول: ${t.entryFee} ذهب`);
      return;
    }

    setRegistering(true);
    try {
      if (user && profile) {
        await supabase
          .from("profiles")
          .update({ gold: currentGold - t.entryFee })
          .eq("id", user.id);
        await refreshProfile();
      }

      const updated = [...registeredIds, t.id];
      setRegisteredIds(updated);
      localStorage.setItem("ludo_registered_tournaments", JSON.stringify(updated));

      sfx.win();
      toast.success(`تم تسجيلك بنجاح في ${t.name}! تم خصم ${t.entryFee} ذهب 🏆`);
    } catch {
      toast.error("تعذر إتمام التسجيل، حاول مجدداً");
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="space-y-4 pb-8" dir="rtl">
      {/* البانر الرئيسي للبطولات */}
      <section className="relative overflow-hidden rounded-2xl border-2 border-ludo-gold/60 bg-gradient-to-b from-[#4d1344] via-[#2a0725] to-[#120210] p-4 text-center shadow-[0_10px_25px_rgba(0,0,0,0.6)]">
        <div className="mx-auto mb-2 grid size-16 place-items-center rounded-2xl border-2 border-ludo-gold bg-ludo-gold/20 shadow-md">
          <Trophy className="size-10 text-ludo-gold animate-pulse" />
        </div>
        <h3 className="text-xl font-black text-ludo-gold drop-shadow">
          بطولات وكؤوس عقور لدو الكبرى
        </h3>
        <p className="mt-1 text-xs text-ludo-soft">
          نافس أبطال اللعبة، واكسب جوائز تصل إلى 100,000 عملة ذهبية وشارات أسطورية!
        </p>

        <div className="mt-3 flex items-center justify-around rounded-xl border border-ludo-gold/30 bg-black/50 p-2 text-xs">
          <div>
            <span className="block text-[10px] text-ludo-soft">إجمالي الجوائز</span>
            <b className="text-ludo-gold font-black">180,000+ 🪙</b>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div>
            <span className="block text-[10px] text-ludo-soft">الماس المتاح</span>
            <b className="text-cyan-400 font-black">780 💎</b>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div>
            <span className="block text-[10px] text-ludo-soft">البطولات النشطة</span>
            <b className="text-emerald-400 font-black">4 بطولات</b>
          </div>
        </div>
      </section>

      {/* قائمة البطولات النشطة */}
      <section className="space-y-3">
        <h4 className="text-sm font-black text-ludo-gold flex items-center gap-1.5 px-1">
          <Crown className="size-4 text-ludo-gold" /> البطولات المفتوحة للتسجيل والمنافسة
        </h4>

        <div className="space-y-2.5">
          {TOURNAMENTS.map((t) => {
            const isRegistered = registeredIds.includes(t.id);
            return (
              <div
                key={t.id}
                className={cn(
                  "relative overflow-hidden rounded-2xl border p-3.5 transition shadow-md",
                  isRegistered
                    ? "border-emerald-500/70 bg-gradient-to-br from-[#1b3d22] to-[#0c1c10]"
                    : "border-ludo-gold/40 bg-gradient-to-b from-[#2e092b] to-[#140213] hover:border-ludo-gold/80",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-ludo-gold/20 border border-ludo-gold/40 text-2xl shadow-inner">
                      {t.icon}
                    </div>
                    <div className="min-w-0 text-right">
                      <div className="flex items-center gap-2">
                        <b className="truncate text-sm font-bold text-white">{t.name}</b>
                        {isRegistered && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 px-2 py-0.5 text-[9px] font-black text-emerald-300">
                            <CheckCircle2 className="size-3" /> مسجل
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-ludo-soft line-clamp-1 mt-0.5">{t.desc}</p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-ludo-soft">
                        <span className="flex items-center gap-1 text-ludo-gold font-bold">
                          <Trophy className="size-3" /> {t.prizeGold.toLocaleString("ar-EG")} عملة
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Users className="size-3" /> {t.registeredCount}/{t.maxPlayers}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" /> {t.timeRemaining}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Button
                      variant={isRegistered ? "royal" : "play"}
                      size="sm"
                      onClick={() => setSelectedTourney(t)}
                      className="text-xs font-bold px-3 shadow"
                    >
                      {isRegistered ? "تفاصيل البطولة" : "انضمام (تفاصيل)"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* نافذة تفاصيل البطولة المنبثقة */}
      {selectedTourney && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border-2 border-ludo-gold/70 bg-gradient-to-b from-[#400e37] via-[#230520] to-[#11010f] p-5 shadow-[0_0_35px_rgba(255,215,0,0.3)] space-y-4">
            <button
              type="button"
              onClick={() => setSelectedTourney(null)}
              className="absolute top-4 left-4 grid size-8 place-items-center rounded-full border border-white/20 bg-black/40 text-white hover:bg-black/70"
            >
              <X className="size-4" />
            </button>

            <div className="text-center space-y-1">
              <span className="text-4xl">{selectedTourney.icon}</span>
              <h3 className="text-lg font-black text-ludo-gold">{selectedTourney.name}</h3>
              <p className="text-xs text-ludo-soft">{selectedTourney.desc}</p>
            </div>

            {/* تفاصيل الجوائز */}
            <div className="rounded-2xl border border-ludo-gold/30 bg-black/40 p-3 space-y-2">
              <h4 className="text-xs font-bold text-ludo-gold flex items-center gap-1">
                <Medal className="size-4 text-ludo-gold" /> توزيع مكافآت المراكز الأولى:
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl border border-ludo-gold/50 bg-ludo-gold/15 p-2">
                  <span className="block text-base">🥇</span>
                  <span className="text-[10px] text-ludo-soft">المركز الأول</span>
                  <b className="block text-ludo-gold font-bold text-xs mt-0.5">
                    {Math.round(selectedTourney.prizeGold * 0.6).toLocaleString("ar-EG")} 🪙
                  </b>
                  {selectedTourney.prizeDiamonds > 0 && (
                    <span className="text-[9px] text-cyan-300 font-bold">
                      +{Math.round(selectedTourney.prizeDiamonds * 0.6)} 💎
                    </span>
                  )}
                </div>
                <div className="rounded-xl border border-slate-300/40 bg-white/5 p-2">
                  <span className="block text-base">🥈</span>
                  <span className="text-[10px] text-ludo-soft">المركز الثاني</span>
                  <b className="block text-slate-200 font-bold text-xs mt-0.5">
                    {Math.round(selectedTourney.prizeGold * 0.25).toLocaleString("ar-EG")} 🪙
                  </b>
                </div>
                <div className="rounded-xl border border-amber-600/40 bg-amber-900/10 p-2">
                  <span className="block text-base">🥉</span>
                  <span className="text-[10px] text-ludo-soft">المركز الثالث</span>
                  <b className="block text-amber-400 font-bold text-xs mt-0.5">
                    {Math.round(selectedTourney.prizeGold * 0.15).toLocaleString("ar-EG")} 🪙
                  </b>
                </div>
              </div>
            </div>

            {/* مواصفات وقواعد الجولة */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-white/10 bg-black/30 p-2">
                <span className="text-[10px] text-ludo-soft block">رسوم الاشتراك</span>
                <b className="text-ludo-gold font-bold">{selectedTourney.entryFee} عملة ذهبية</b>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-2">
                <span className="text-[10px] text-ludo-soft block">وقت النرد</span>
                <b className="text-white font-bold">{selectedTourney.speedSec} ثوانٍ لكل لاعب</b>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-2">
                <span className="text-[10px] text-ludo-soft block">المشاركون</span>
                <b className="text-white font-bold">
                  {selectedTourney.registeredCount} / {selectedTourney.maxPlayers} مسجلين
                </b>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-2">
                <span className="text-[10px] text-ludo-soft block">نظام المباراة</span>
                <b className="text-cyan-300 font-bold">{selectedTourney.modeLabel}</b>
              </div>
            </div>

            {/* أزرار الإجراء */}
            <div className="space-y-2 pt-1">
              {registeredIds.includes(selectedTourney.id) ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 p-2 text-xs font-bold text-emerald-300">
                    <CheckCircle2 className="size-4" /> أنت مسجل في هذه البطولة ومقعدك محجوز!
                  </div>
                  {onStartTournamentMatch && (
                    <Button
                      variant="play"
                      size="xl"
                      onClick={() => {
                        onStartTournamentMatch(selectedTourney);
                        setSelectedTourney(null);
                      }}
                      className="w-full text-base font-black shadow-lg"
                    >
                      <Swords className="size-5 ml-1" /> بدء جولة المنافسة الآن 🎲
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  variant="play"
                  size="xl"
                  disabled={registering}
                  onClick={() => void handleRegister(selectedTourney)}
                  className="w-full text-base font-black shadow-lg"
                >
                  <Trophy className="size-5 ml-1" /> تسجيل ودفع الرسوم ({selectedTourney.entryFee}{" "}
                  ذهب)
                </Button>
              )}

              <Button
                variant="ghostGold"
                className="w-full text-xs"
                onClick={() => setSelectedTourney(null)}
              >
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* زر العودة */}
      <div className="pt-2">
        <Button variant="ghostGold" className="w-full" onClick={onBack}>
          العودة للرئيسية
        </Button>
      </div>
    </div>
  );
}
