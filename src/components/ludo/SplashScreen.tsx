import { useEffect, useState } from "react";
import { Crown, Sparkles, Star } from "lucide-react";
import diceRoyal from "@/assets/dice-royal.png";
import brandMark from "@/assets/brand-mark.png";

/**
 * شاشة الترحيب والتحميل الملكية الحصرية لتطبيق عبقور لودو
 * تحتوي على نرد ملكي متحرك ثلاثي الأبعاد وتصميم عربي فاخر وتأثيرات ذهبية
 * مع حقوق التطوير والتصميم: تم تطوير وتصميم هذا التطبيق بواسطة أبو خلف
 */
export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(12);
  const [tipIndex, setTipIndex] = useState(0);
  const [customImage, setCustomImage] = useState<string | null>(null);

  const tips = [
    "جارٍ تجهيز النرد الملكي ورقعة اللعب...",
    "جارٍ الاتصال بقاعة الملوك والأبطال...",
    "أهلاً وسهلاً بك في عالم لودو الأسطوري!",
  ];

  useEffect(() => {
    // Check if custom splash image was set
    try {
      const saved = localStorage.getItem("ludo_splash_image");
      if (saved) setCustomImage(saved);
    } catch {
      // ignore
    }

    const interval = window.setInterval(() => {
      setPct((p) => {
        if (p >= 100) return 100;
        const add = Math.max(3, Math.round((100 - p) / 6));
        return Math.min(100, p + add);
      });
    }, 70);

    const tipTimer = window.setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 900);

    const timer = window.setTimeout(onDone, 2400);

    return () => {
      window.clearInterval(interval);
      window.clearInterval(tipTimer);
      window.clearTimeout(timer);
    };
  }, [onDone, tips.length]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col justify-between overflow-hidden bg-[#1f051c] text-white select-none"
      dir="rtl"
      style={
        customImage
          ? {
              backgroundImage: `url(${customImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      {/* خلفية جمالية ملكية مع تدرجات مخملية وزخارف */}
      {!customImage && (
        <div className="absolute inset-0 pointer-events-none">
          {/* تدرج لوني فخم */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#4d0f3e] via-[#240520] to-[#0d010c] opacity-95" />

          {/* هالة ضوئية مركزية */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full bg-gradient-to-tr from-amber-500/20 via-pink-500/15 to-transparent blur-3xl" />

          {/* نجوم وشرارات متناثرة */}
          <div className="absolute inset-0 bg-[radial-gradient(#f6c32c_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />

          {/* خطوط وزخرفة ذهبية ناعمة */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#f6c32c] to-transparent" />
          <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#f6c32c] to-transparent" />
        </div>
      )}

      {/* رأس الشاشة: التاج الملكي */}
      <div className="relative z-10 pt-10 px-6 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-black/40 px-4 py-1 backdrop-blur-md shadow-[0_0_15px_rgba(246,195,44,0.25)]">
          <Crown className="size-4 text-amber-400 animate-pulse" />
          <span className="text-xs font-black tracking-wider text-amber-300">
            النسخة الملكية الأصلية
          </span>
          <Sparkles className="size-3.5 text-amber-400" />
        </div>
      </div>

      {/* المحتوى المركزي: شعار الترحيب والنرد الملكي المتحرك */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 py-4 text-center my-auto">
        {/* النرد الملكي المتحرك ثلاثي الأبعاد مع هالة توهج */}
        <div className="relative mb-6">
          {/* هالة التوهج الدائرية خلف النرد */}
          <div className="absolute inset-0 -m-6 rounded-full bg-amber-500/30 blur-2xl animate-pulse" />
          <div className="absolute inset-0 -m-2 rounded-full border border-amber-400/50 animate-ping opacity-25" />

          {/* تصميم النرد مع دوران وحركة تذبذب ثلاثية الأبعاد */}
          <div className="relative size-32 sm:size-36 flex items-center justify-center transition-transform">
            <div className="relative size-full animate-[bounce_2.4s_infinite_ease-in-out]">
              <img
                src={diceRoyal}
                alt="نرد لودو الملكي"
                className="size-full object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)] filter brightness-110 animate-[spin_6s_linear_infinite]"
              />
              {/* شعار التاج الصغير فوق النرد */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 grid size-9 place-items-center rounded-full bg-gradient-to-b from-amber-300 to-amber-600 text-black shadow-lg border border-yellow-100">
                <Crown className="size-5 text-[#25061f]" />
              </div>
            </div>
          </div>
        </div>

        {/* عنوان الترحيب الملكي */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Star className="size-4 text-amber-400 fill-amber-400" />
            <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ffe484] via-[#f6c32c] to-[#e49b13] drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] tracking-wide">
              أهلاً بك في لودو
            </h1>
            <Star className="size-4 text-amber-400 fill-amber-400" />
          </div>

          <div className="flex items-center justify-center gap-2">
            <img src={brandMark} alt="عبقور" className="size-5 object-contain" />
            <h2 className="text-sm sm:text-base font-bold text-pink-200 tracking-wider">
              عبقور لودو الملكية | ABQOR LUDO
            </h2>
          </div>
        </div>

        {/* بطاقة نصية صغيرة للترحيب */}
        <p className="mt-3 text-xs font-semibold text-amber-200/80 max-w-xs transition-opacity duration-300">
          {tips[tipIndex]}
        </p>
      </div>

      {/* الجزء السفلي: شريط التقدم + حقوق التطوير والتصميم بواسطة أبو خلف */}
      <div className="relative z-10 pb-8 px-6 space-y-4">
        {/* شريط التقدم الفاخر */}
        <div className="space-y-1.5 max-w-xs mx-auto">
          <div className="relative h-3 w-full overflow-hidden rounded-full border border-amber-400/60 bg-black/60 p-0.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] backdrop-blur-sm">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-[0_0_12px_rgba(246,195,44,0.75)] transition-all duration-150 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-black text-amber-300 px-1">
            <span>جارٍ التحميل...</span>
            <span>{pct}%</span>
          </div>
        </div>

        {/* خانة الحقوق بخط صغير كما طلب المستخدم نصاً: تم تطوير وتصميم هذا التطبيق بواسطة أبو خلف */}
        <div className="pt-2 text-center">
          <div className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-400/30 bg-black/50 px-3.5 py-1.5 backdrop-blur-md shadow-md">
            <Crown className="size-3.5 text-amber-400 shrink-0" />
            <p className="text-[11px] font-bold text-amber-200/90 tracking-normal">
              تم تطوير وتصميم هذا التطبيق بواسطة أبو خلف
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
