import {
  Download,
  Gamepad2,
  Share2,
  Smartphone,
  Sparkles,
  Volume2,
  VolumeX,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { sfx } from "@/lib/audio";
import type { GameplayPrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export function SettingsPanel({
  muted,
  volume,
  animations,
  haptics,
  gameplay,
  onMuted,
  onVolume,
  onAnimations,
  onHaptics,
  onGameplay,
}: {
  muted: boolean;
  volume: number;
  animations: boolean;
  haptics: boolean;
  gameplay: GameplayPrefs;
  onMuted: (v: boolean) => void;
  onVolume: (v: number) => void;
  onAnimations: (v: boolean) => void;
  onHaptics: (v: boolean) => void;
  onGameplay: (v: GameplayPrefs) => void;
}) {
  return (
    <div className="space-y-3">
      <section className="rounded-xl border border-ludo-gold/35 bg-ludo-panel/70 p-4">
        <h3 className="mb-3 flex items-center gap-2 font-bold text-ludo-gold">
          <Gamepad2 className="size-5" /> إعدادات اللعب
        </h3>
        <span className="text-sm text-ludo-soft">عدد اللاعبين الافتراضي</span>
        <div className="mt-2 flex gap-2">
          {([2, 3, 4] as const).map((n) => (
            <Button
              key={n}
              size="sm"
              variant={gameplay.players === n ? "royal" : "neon"}
              aria-pressed={gameplay.players === n}
              aria-label={`${n} لاعبين`}
              onClick={() => onGameplay({ ...gameplay, players: n })}
            >
              {n}
            </Button>
          ))}
        </div>

        <label className="mt-4 block text-sm text-ludo-soft" htmlFor="turn-seconds">
          وقت كل حركة: <b className="text-ludo-gold">{gameplay.turnSeconds} ثانية</b>
        </label>
        <input
          id="turn-seconds"
          type="range"
          min={5}
          max={60}
          step={5}
          value={gameplay.turnSeconds}
          onChange={(e) => onGameplay({ ...gameplay, turnSeconds: Number(e.target.value) })}
          className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-ludo-deep accent-ludo-gold"
        />

        <label className="mt-4 block text-sm text-ludo-soft" htmlFor="move-speed">
          سرعة تنقل القطع: <b className="text-ludo-gold">{gameplay.moveMs} مللي ثانية</b>
        </label>
        <input
          id="move-speed"
          type="range"
          min={80}
          max={900}
          step={20}
          value={gameplay.moveMs}
          onChange={(e) => onGameplay({ ...gameplay, moveMs: Number(e.target.value) })}
          className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-ludo-deep accent-ludo-gold"
        />
        <p className="mt-3 text-xs text-ludo-soft">
          تُطبَّق هذه الإعدادات على المباريات الفردية ومباريات الغرف الجماعية.
        </p>
      </section>

      <section className="rounded-xl border border-ludo-gold/35 bg-ludo-panel/70 p-4">
        <h3 className="mb-3 flex items-center gap-2 font-bold text-ludo-gold">
          <Volume2 className="size-5" /> الصوت
        </h3>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-ludo-soft">كتم كل المؤثرات</span>
          <Button
            variant={muted ? "neon" : "royal"}
            size="sm"
            onClick={() => onMuted(!muted)}
            aria-pressed={muted}
          >
            {muted ? <VolumeX /> : <Volume2 />}
            {muted ? "مكتوم" : "مفعّل"}
          </Button>
        </div>
        <label className="mt-4 block text-sm text-ludo-soft" htmlFor="sfx-volume">
          مستوى المؤثرات: <b className="text-ludo-gold">{Math.round(volume * 100) + "%"}</b>
        </label>
        <input
          id="sfx-volume"
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(volume * 100)}
          disabled={muted}
          onChange={(e) => onVolume(Number(e.target.value) / 100)}
          onPointerUp={() => !muted && sfx.diceLand(4)}
          className={cn(
            "mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-ludo-deep accent-ludo-gold",
            muted && "opacity-40",
          )}
        />
      </section>

      <section className="rounded-xl border border-ludo-gold/35 bg-ludo-panel/70 p-4">
        <h3 className="mb-3 flex items-center gap-2 font-bold text-ludo-gold">
          <Smartphone className="size-5" /> الاهتزاز
        </h3>
        <div className="flex items-center justify-between gap-3">
          <span className="min-w-0 text-sm text-ludo-soft">اهتزاز النرد والحركة والالتقاط</span>
          <Button
            variant={haptics ? "royal" : "neon"}
            size="sm"
            onClick={() => onHaptics(!haptics)}
            aria-pressed={haptics}
          >
            {haptics ? "مفعّل" : "موقوف"}
          </Button>
        </div>
        <p className="mt-3 text-xs text-ludo-soft">
          يعمل على الأجهزة التي تدعم الاهتزاز فقط، وتوقيته مضبوط على كل انتقال في المباراة.
        </p>
      </section>

      <section className="rounded-xl border border-ludo-gold/35 bg-ludo-panel/70 p-4">
        <h3 className="mb-3 flex items-center gap-2 font-bold text-ludo-gold">
          <Sparkles className="size-5" /> الرسوم والاحتفالات
        </h3>
        <div className="flex items-center justify-between gap-3">
          <span className="min-w-0 text-sm text-ludo-soft">
            الاحتفالات المتحركة والقصاصات الورقية
          </span>
          <Button
            variant={animations ? "royal" : "neon"}
            size="sm"
            onClick={() => onAnimations(!animations)}
            aria-pressed={animations}
          >
            {animations ? "مفعّلة" : "موقوفة"}
          </Button>
        </div>
        <p className="mt-3 text-xs text-ludo-soft">
          إيقاف الاحتفالات يخفّف الحركة ويحسّن الأداء على الأجهزة الضعيفة، ولا يعطّل اللعب أو تسجيل
          النتائج.
        </p>
      </section>

      <InstallSettingsSection />
    </div>
  );
}

function InstallSettingsSection() {
  const [copied, setCopied] = useState(false);

  // الرابط المشترك العام الخالي من أي قيود جلسة أو كوكيز
  const PUBLIC_APP_ORIGIN =
    "https://ais-pre-k2ipyn3yz6cpnmoqhb2huc-417783324423.europe-west2.run.app";

  // رابط التنزيل المباشر للملف (يتنزل فوراً كـ abqor-ludo.apk)
  const directApkDownloadLink = `${PUBLIC_APP_ORIGIN}/api/download/apk`;

  const handleDownloadApkFile = () => {
    sfx.win();
    const link = document.createElement("a");
    link.href = "/api/download/apk";
    link.download = "abqor-ludo.apk";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("بدأ تنزيل ملف اللعبة abqor-ludo.apk فوراً على هاتفك! 📥🎉");
  };

  const handleCopyDirectLink = () => {
    try {
      navigator.clipboard.writeText(directApkDownloadLink);
      setCopied(true);
      sfx.tap();
      toast.success("تم نسخ رابط التنزيل المباشر! أرسله لأصدقائك ليتنزل الملف فوراً 📋");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("تعذر نسخ الرابط");
    }
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `🎲 حمل ملف لعبة عبقور لودو الملكية بصيغة APK فوراً على جهازك:\n${directApkDownloadLink}\n\n(اضغط على الرابط وسيبدأ تنزيل ملف abqor-ludo.apk مباشرة!)`,
    );
    window.open(`https://api.whatsapp.com/send?text=${message}`, "_blank");
  };

  return (
    <section className="rounded-xl border-2 border-ludo-gold/60 bg-gradient-to-b from-[#400e36] to-[#20041b] p-4 space-y-3">
      <h3 className="flex items-center gap-2 font-bold text-ludo-gold text-base">
        <Smartphone className="size-5 text-ludo-gold" />
        تنزيل ملف الـ APK المباشر ومشاركته
      </h3>
      <p className="text-xs text-ludo-soft leading-relaxed">
        قم بتنزيل ملف اللعبة الحقيقي بصيغة <b>.APK</b> مباشرة على جهازك دون أي قيود، وشاركه مع
        أصدقائك ليتنزل فوراً عند نقرهم على الرابط بدون طلب تسجيل أو شاشات خطأ.
      </p>

      <div className="space-y-2 pt-1">
        {/* زر التنزيل الفوري للملف */}
        <Button
          variant="play"
          size="lg"
          onClick={handleDownloadApkFile}
          className="w-full text-sm font-black shadow-lg py-3 flex items-center justify-center gap-2"
        >
          <Download className="size-5" />
          تنزيل ملف (abqor-ludo.apk) فوراً على هذا الجهاز
        </Button>

        {/* أزرار المشاركة والنسخ المباشر للأصدقاء */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            variant="ghostGold"
            size="sm"
            onClick={handleCopyDirectLink}
            className="text-xs font-bold"
          >
            {copied ? (
              <Check className="size-3.5 ml-1 text-emerald-400" />
            ) : (
              <Copy className="size-3.5 ml-1" />
            )}
            {copied ? "تم النسخ ✓" : "نسخ رابط التنزيل للأصدقاء"}
          </Button>

          <Button
            variant="neon"
            size="sm"
            onClick={handleShareWhatsApp}
            className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white border-none"
          >
            <Smartphone className="size-3.5 ml-1" />
            مشاركة عبر واتساب
          </Button>
        </div>

        <p className="text-[11px] text-emerald-300 text-center pt-1 font-semibold">
          ✓ الرابط مجهز للتنزيل الفوري والمباشر لملف الـ APK دون الحاجة لتسجيل دخول أو أذونات كوكيز
        </p>
      </div>
    </section>
  );
}
