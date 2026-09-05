import { Dices, LogIn, Sparkles, UserPlus, Play } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg.asset.json";
import { Button } from "@/components/ui/button";

type Props = {
  onSignIn: () => void;
  onSignUp: () => void;
  onGuest: () => void;
};

/** شاشة الدخول الرئيسية الفاخرة مع شعار النرد والترحيب العربي */
export function GateScreen({ onSignIn, onSignUp, onGuest }: Props) {
  return (
    <div
      className="hero-stage flex flex-col items-center justify-between p-6 text-white min-h-[100dvh]"
      dir="rtl"
      style={{ backgroundImage: `url(${heroBg.url})` }}
    >
      {/* شارة علوية فاخرة */}
      <div className="w-full flex justify-center pt-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-ludo-gold/50 bg-black/60 px-4 py-1 text-xs font-black text-ludo-gold shadow-[0_0_15px_rgba(255,215,0,0.3)] backdrop-blur-md">
          <Sparkles className="size-3.5 text-ludo-gold animate-pulse" />
          <span>النسخة الملكية المطورة</span>
        </div>
      </div>

      {/* شعار النرد والترحيب الفاخر */}
      <div className="flex flex-col items-center gap-3 text-center my-auto animate-in zoom-in-95 fade-in duration-500">
        {/* شعار نرد ثلاثي الأبعاد مجسم ومضيء */}
        <div className="relative grid size-24 place-items-center rounded-3xl border-2 border-ludo-gold bg-gradient-to-br from-[#8d2a72] via-[#4d0c3c] to-[#24031c] shadow-[0_0_35px_rgba(255,215,0,0.6)]">
          <Dices className="size-14 text-ludo-gold drop-shadow-[0_4px_10px_rgba(0,0,0,0.7)] animate-pulse" />
          <span className="absolute -top-1.5 -right-1.5 text-lg">✨</span>
          <span className="absolute -bottom-1.5 -left-1.5 text-sm">🎲</span>
        </div>

        <div className="space-y-1 mt-2">
          <h1 className="font-display text-3xl sm:text-4xl font-black text-ludo-gold drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] tracking-wide">
            مرحباً بك في عقور لدو
          </h1>
          <p className="text-sm font-bold text-slate-200 drop-shadow max-w-xs mx-auto">
            عالم التحديات الحقيقية، الرتب الملكية، والمنافسات الملحمية
          </p>
        </div>
      </div>

      {/* أزرار الدخول وإنشاء الحساب المنظمة بدون أي انضغاط */}
      <div className="w-full max-w-sm space-y-3 pb-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onSignIn}
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-ludo-gold/70 bg-gradient-to-b from-[#2563eb] to-[#1e3a8a] py-3.5 px-4 text-sm font-black text-white shadow-[0_6px_20px_rgba(37,99,235,0.4)] transition hover:brightness-110 active:scale-95"
          >
            <LogIn className="size-4" />
            <span>تسجيل الدخول</span>
          </button>

          <button
            type="button"
            onClick={onSignUp}
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-ludo-gold bg-gradient-to-b from-[#a21caf] to-[#701a75] py-3.5 px-4 text-sm font-black text-white shadow-[0_6px_20px_rgba(162,28,175,0.4)] transition hover:brightness-110 active:scale-95"
          >
            <UserPlus className="size-4" />
            <span>إنشاء حساب</span>
          </button>
        </div>

        {/* خيار اللعب السريع كضيف */}
        <button
          type="button"
          onClick={onGuest}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-emerald-400/80 bg-gradient-to-b from-[#16a34a] to-[#14532d] py-3.5 px-4 text-sm font-black text-white shadow-[0_6px_20px_rgba(22,163,74,0.4)] transition hover:brightness-110 active:scale-95"
        >
          <Play className="size-4 fill-white" />
          <span>العب كضيف مباشرة</span>
        </button>

        <p className="text-[11px] text-center text-slate-300/80 pt-1">
          بالمتابعة أنت توافق على شروط الاستخدام وقواعد اللعب النظيف
        </p>
      </div>
    </div>
  );
}
