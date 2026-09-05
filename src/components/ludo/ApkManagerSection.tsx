import { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  HelpCircle,
  Image as ImageIcon,
  Package,
  QrCode,
  RefreshCw,
  Save,
  Send,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { sfx } from "@/lib/audio";

export const OFFICIAL_APP_URL =
  "https://ais-pre-k2ipyn3yz6cpnmoqhb2huc-417783324423.europe-west2.run.app";

export const getLiveAppUrl = () => {
  if (
    typeof window !== "undefined" &&
    window.location.origin &&
    !window.location.origin.includes("localhost")
  ) {
    return window.location.origin;
  }
  return OFFICIAL_APP_URL;
};

export const DEFAULT_APK_DOWNLOAD_URL = `${OFFICIAL_APP_URL}/api/download/apk`;

export function ApkManagerSection() {
  const { isInstallable, isInstalled, install, isAndroid, isIOS } = usePWAInstall();

  const currentAppUrl = getLiveAppUrl();
  const directApkUrl = `${OFFICIAL_APP_URL}/api/download/apk`;

  // Saved Direct APK URL in storage (محدث دائماً)
  const [apkUrl, setApkUrl] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("ludo_apk_download_url");
      if (saved && saved.trim() && saved.includes(".apk")) return saved.trim();
      return directApkUrl;
    } catch {
      return directApkUrl;
    }
  });

  const [savingUrl, setSavingUrl] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedApk, setCopiedApk] = useState(false);
  const [iconVersion, setIconVersion] = useState(() => Date.now());
  const [uploadingIcon, setUploadingIcon] = useState(false);

  const handleCustomIconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار ملف صورة صالح (PNG أو JPG أو WebP) ⚠️");
      return;
    }

    setUploadingIcon(true);
    sfx.roll();
    const loadingToast = toast.loading("جارٍ معالجة وتطبيق أيقونة التطبيق والـ APK... ⏳");

    try {
      const formData = new FormData();
      formData.append("icon", file);

      const response = await fetch("/api/upload-icon", {
        method: "POST",
        body: formData,
      });

      const res = await response.json();
      if (res.success) {
        setIconVersion(Date.now());
        sfx.win();
        toast.dismiss(loadingToast);
        toast.success("تم تخصيص وتطبيق أيقونة التطبيق والـ APK بنجاح! 👑🎨");
      } else {
        throw new Error(res.error || "فشل رفع الأيقونة");
      }
    } catch (err: unknown) {
      toast.dismiss(loadingToast);
      console.error(err);
      toast.error("حدث خطأ أثناء معالجة الأيقونة. يرجى تجربة صورة مربعة واضحة.");
    } finally {
      setUploadingIcon(false);
      event.target.value = "";
    }
  };

  const handleSaveApkUrl = () => {
    setSavingUrl(true);
    try {
      localStorage.setItem("ludo_apk_download_url", apkUrl.trim());
      sfx.home();
      toast.success("تم حفظ وتحديث رابط تحميل ملف الـ APK بنجاح! 📱✨");
    } catch {
      toast.error("تعذر حفظ الرابط");
    } finally {
      setSavingUrl(false);
    }
  };

  const handleResetToDefault = () => {
    setApkUrl(DEFAULT_APK_DOWNLOAD_URL);
    try {
      localStorage.setItem("ludo_apk_download_url", DEFAULT_APK_DOWNLOAD_URL);
      sfx.tap();
      toast.success("تم تحديث واستعادة رابط التحميل المعتمد بنجاح! 🚀");
    } catch {
      //
    }
  };

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(currentAppUrl);
      setCopiedLink(true);
      sfx.tap();
      toast.success("تم نسخ رابط التطبيق والمشاركة للحافظة! 📋");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("تعذر نسخ الرابط");
    }
  };

  const handleCopyApk = () => {
    const urlToCopy = apkUrl || directApkUrl;
    try {
      navigator.clipboard.writeText(urlToCopy);
      setCopiedApk(true);
      sfx.tap();
      toast.success("تم نسخ رابط تنزيل ملف APK المباشر للأصدقاء! 📋");
      setTimeout(() => setCopiedApk(false), 2000);
    } catch {
      toast.error("تعذر نسخ الرابط");
    }
  };

  const handleShareWhatsApp = () => {
    const downloadTarget = apkUrl || directApkUrl;
    const message = encodeURIComponent(
      `🎲 حمل ملف لعبة عبقور لودو الملكية بصيغة APK فوراً على جهازك:\n${downloadTarget}\n\n(اضغط على الرابط وسيبدأ تحميل ملف abqor-ludo.apk مباشرة على هاتفك!)`,
    );
    window.open(`https://api.whatsapp.com/send?text=${message}`, "_blank");
  };

  const handleShareTelegram = () => {
    const downloadTarget = apkUrl || directApkUrl;
    const text = encodeURIComponent(
      `🎲 رابط تنزيل ملف لعبة عبقور لودو (APK مباشر):\n${downloadTarget}`,
    );
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(downloadTarget)}&text=${text}`,
      "_blank",
    );
  };

  const handleDirectInstall = async () => {
    sfx.roll();
    if (isInstalled) {
      toast.info("التطبيق مثبت بالفعل على جهازك! 🎉");
      return;
    }

    if (isInstallable) {
      const ok = await install();
      if (ok) {
        toast.success("تهانينا! تم تثبيت تطبيق لودو بنجاح على جهازك! 👑");
      }
    } else {
      toast.info(
        "لتثبيت التطبيق على أندرويد:\nاضغط على خيارات المتصفح (⋮) ثم اختر 'إضافة إلى الشاشة الرئيسية' أو 'تثبيت التطبيق'.",
      );
    }
  };

  const handleDownloadApkFile = () => {
    sfx.win();
    const link = document.createElement("a");
    link.href =
      apkUrl && apkUrl.startsWith("http") && !apkUrl.includes(window.location.host)
        ? apkUrl
        : "/api/download/apk";
    link.download = "abqor-ludo.apk";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("بدأ تنزيل ملف abqor-ludo.apk فوراً على جهازك! 📥");
  };

  const handleExportAndroidBundle = () => {
    const configData = {
      appId: "com.ludu.game",
      appName: "LUDU - عبقور لودو",
      version: "1.0.4",
      webDir: "dist",
      serverUrl: currentAppUrl,
      generatedAt: new Date().toISOString(),
      instructions: [
        "1. قم بفتح مجلد android في أندرويد ستوديو (Android Studio)",
        "2. قم بمزامنة Gradle عبر Sync Project with Gradle Files",
        "3. اختر Build > Build Bundle(s) / APK(s) > Build APK(s)",
        "4. ستحصل على ملف app-release.apk جاهز للرفع والتوزيع دون أي تعارض",
      ],
    };

    const blob = new Blob([JSON.stringify(configData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "abqor-ludo-android-config.json";
    a.click();
    URL.revokeObjectURL(url);
    sfx.home();
    toast.success("تم تنزيل ملف إعدادات حزمة الأندرويد بنجاح! 📦");
  };

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* بطاقة الترحيب والتحميل الرئيسية مع أيقونة التطبيق الحية */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-ludo-gold/60 bg-gradient-to-b from-[#4d1344] via-[#2a0725] to-[#120210] p-4 text-center shadow-[0_10px_25px_rgba(0,0,0,0.6)]">
        <div className="relative mx-auto mb-2 size-20 rounded-2xl border-2 border-ludo-gold bg-gradient-to-b from-amber-400/20 to-black/60 p-1 shadow-[0_0_25px_rgba(255,215,0,0.35)] transition-transform hover:scale-105">
          <img
            src={`/app-icon-512.png?v=${iconVersion}`}
            alt="أيقونة عبقور لودو المعتمدة"
            className="size-full rounded-xl object-cover shadow-md"
            referrerPolicy="no-referrer"
          />
          <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white shadow ring-2 ring-black font-black">
            ✓
          </span>
        </div>
        <h3 className="text-xl font-black text-ludo-gold drop-shadow flex items-center justify-center gap-2">
          <Sparkles className="size-5" /> مركز تنزيل ملف الـ APK المباشر
        </h3>
        <p className="mt-1 text-xs text-ludo-soft max-w-md mx-auto">
          تنزيل ملف اللعبة الحقيقي بصيغة .APK مباشرة على هاتفك ومشاركته مع أصدقائك ليتنزل فوراً عند
          ضغطهم عليه!
        </p>

        {/* زر التنزيل الفوري الأبرز */}
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <Button
            variant="play"
            size="lg"
            onClick={handleDownloadApkFile}
            className="flex-1 text-sm font-black shadow-lg py-3 flex items-center justify-center gap-2"
          >
            <Download className="size-5 ml-1" />
            تنزيل ملف (abqor-ludo.apk) فوراً 📥
          </Button>

          <Button
            variant="ghostGold"
            size="lg"
            onClick={handleCopyApk}
            className="text-xs font-bold"
          >
            {copiedApk ? (
              <CheckCircle2 className="size-4 ml-1.5 text-emerald-400" />
            ) : (
              <Copy className="size-4 ml-1.5" />
            )}
            {copiedApk ? "تم نسخ الرابط ✓" : "نسخ رابط التنزيل للأصدقاء"}
          </Button>
        </div>
      </div>

      {/* قسم تخصيص أيقونة التطبيق (App Icon) */}
      <div className="rounded-2xl border border-ludo-gold/50 bg-gradient-to-b from-[#2e0a29] via-[#1a0519] to-[#0d010c] p-4 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <span className="rounded-full border border-ludo-gold/40 bg-ludo-gold/10 px-2.5 py-0.5 text-[10px] font-black text-ludo-gold">
            App Icon Mipmap & Web
          </span>
          <h4 className="text-sm font-black text-ludo-gold flex items-center gap-1.5">
            <ImageIcon className="size-4 text-ludo-gold" />
            تخصيص أيقونة التطبيق (App Icon)
          </h4>
        </div>

        <p className="text-xs text-ludo-soft leading-relaxed">
          الأيقونة الرسمية المعتمدة تظهر على شاشة الهاتف، درج التطبيقات، وملف التثبيت APK. صممنا لك
          أيقونة ملكية عصرية متكاملة، ويمكنك أيضاً رفع أي صورة تريدها لتطبيقها إجبارياً على كافة
          الأحجام فوراً!
        </p>

        {/* عرض الأيقونة الحالية مع المعاينة */}
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 p-3">
          <div className="relative size-16 shrink-0 rounded-2xl border border-ludo-gold/60 p-0.5 shadow-lg bg-gradient-to-b from-amber-500/20 to-black">
            <img
              src={`/app-icon-512.png?v=${iconVersion}`}
              alt="أيقونة التطبيق المعتمدة"
              className="size-full rounded-[14px] object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="min-w-0 flex-1 text-right">
            <b className="block text-xs font-black text-white truncate">
              أيقونة عبقور لودو الملكية
            </b>
            <span className="text-[11px] text-emerald-400 block mt-0.5 flex items-center gap-1 font-bold">
              <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
              مدمجة في ملف APK و PWA و Favicon (512x512)
            </span>
            <span className="text-[10px] text-white/50 block">
              نرد ثلاثي الأبعاد + تاج ملكي + حلقات لودو الرباعية
            </span>
          </div>
        </div>

        {/* أزرار الإجراءات للأيقونة */}
        <div className="flex flex-wrap gap-2 pt-1">
          <label className="flex-1 cursor-pointer">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleCustomIconUpload}
              disabled={uploadingIcon}
              className="hidden"
            />
            <div className="flex items-center justify-center gap-1.5 rounded-xl border border-ludo-gold/60 bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-2 text-xs font-black text-black shadow hover:brightness-110 active:scale-95 transition-all">
              <Upload className="size-3.5" />
              {uploadingIcon ? "جارٍ التحديث والدمج بالـ APK..." : "رفع صورة مخصصة للأيقونة 🖼️"}
            </div>
          </label>

          <Button
            variant="ghostGold"
            size="sm"
            onClick={() => {
              sfx.tap();
              setIconVersion(Date.now());
              toast.success("تم تحديث وعرض أحدث نسخة للأيقونة! 🔄");
            }}
            className="text-xs font-bold"
          >
            <RefreshCw className="size-3.5 ml-1" />
            تحديث المعاينة
          </Button>
        </div>

        <p className="text-[10px] text-ludo-soft/80 border-t border-white/5 pt-2">
          💡 <b>ملاحظة:</b> يمكنك أيضاً إرسال أي صورة تريدها هنا في المحادثة وسنقوم بدمجها كأيقونة
          إجبارية وضبط مقاساتها بدقة متناهية!
        </p>
      </div>

      {/* القسم الأول: مشاركة رابط التنزيل المباشر مع الأصدقاء */}
      <div className="rounded-2xl border border-ludo-gold/40 bg-gradient-to-b from-[#240622] to-[#10010f] p-4 space-y-3">
        <h4 className="text-sm font-black text-ludo-gold flex items-center gap-1.5">
          <Share2 className="size-4 text-ludo-gold" />
          مشاركة رابط التحميل المباشر مع أصدقائك
        </h4>
        <p className="text-xs text-ludo-soft">
          عند إرسال هذا الرابط لأصدقائك، بمجرد ضغطهم عليه سيبدأ تنزيل ملف اللعبة{" "}
          <b>abqor-ludo.apk</b> فوراً بدون أي شاشات خطأ أو طلب تسجيل!
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            variant="neon"
            size="sm"
            onClick={handleShareWhatsApp}
            className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white border-none"
          >
            <Smartphone className="size-3.5 ml-1" />
            إرسال عبر واتساب
          </Button>

          <Button
            variant="ghostGold"
            size="sm"
            onClick={handleShareTelegram}
            className="text-xs font-bold"
          >
            <Send className="size-3.5 ml-1" />
            إرسال عبر تيليجرام
          </Button>
        </div>
      </div>

      {/* القسم الثاني: إدارة وتخصيص رابط ملف الـ APK المباشر */}
      <div className="rounded-2xl border border-ludo-gold/40 bg-gradient-to-b from-[#2e092b] to-[#140213] p-4 space-y-3 shadow-md">
        <div className="flex items-center justify-between border-b border-ludo-gold/20 pb-2">
          <h4 className="text-sm font-black text-ludo-gold flex items-center gap-1.5">
            <Package className="size-5 text-ludo-gold" />
            ملف الـ APK المباشر المخصص للمسؤول
          </h4>
          <span className="text-[10px] text-ludo-soft">رابط ملف .apk المباشر</span>
        </div>

        <p className="text-xs text-ludo-soft">
          يمكنك هنا تعيين رابط ملف APK المباشر (المرفوع على درايف أو ميديافاير أو موقعك) ليقوم
          اللاعبون بتنزيل ملف الـ APK فوراً بنقرة واحدة:
        </p>

        <div className="space-y-2">
          <Input
            value={apkUrl}
            onChange={(e) => setApkUrl(e.target.value)}
            placeholder="https://example.com/abqor-ludo.apk"
            className="text-left font-mono text-xs dir-ltr bg-black/50 border-ludo-gold/40 text-white"
          />

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              variant="royal"
              size="sm"
              disabled={savingUrl}
              onClick={handleSaveApkUrl}
              className="text-xs font-bold"
            >
              <Save className="size-3.5 ml-1" />
              حفظ الرابط للمسؤول
            </Button>

            <Button
              variant="ghostGold"
              size="sm"
              onClick={handleResetToDefault}
              className="text-xs font-bold"
            >
              <Sparkles className="size-3.5 ml-1 text-ludo-gold" />
              استعادة الرابط المحدث
            </Button>

            <Button
              variant="neon"
              size="sm"
              onClick={handleDownloadApkFile}
              className="text-xs font-bold"
            >
              <Download className="size-3.5 ml-1" />
              تنزيل ملف الـ APK المباشر
            </Button>

            <Button
              variant="ghostGold"
              size="sm"
              onClick={handleCopyApk}
              className="text-xs font-bold"
            >
              <Copy className="size-3.5 ml-1" />
              {copiedApk ? "تم النسخ ✓" : "نسخ رابط الـ APK"}
            </Button>
          </div>
        </div>
      </div>

      {/* القسم الثالث: أزرار مشاركة سريعة للمستخدمين والأصدقاء */}
      <div className="rounded-2xl border border-ludo-gold/30 bg-gradient-to-b from-[#240622] to-[#10010f] p-4 space-y-3">
        <h4 className="text-sm font-black text-ludo-gold flex items-center gap-1.5">
          <Share2 className="size-4 text-ludo-gold" />
          مشاركة رابط التنزيل مع اللاعبين فوراً
        </h4>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="neon"
            size="sm"
            onClick={handleShareWhatsApp}
            className="w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white border-none"
          >
            <Send className="size-3.5 ml-1.5" />
            مشاركة عبر واتساب
          </Button>

          <Button
            variant="royal"
            size="sm"
            onClick={handleShareTelegram}
            className="w-full text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white border-none"
          >
            <Send className="size-3.5 ml-1.5" />
            مشاركة عبر تيليجرام
          </Button>
        </div>
      </div>

      {/* القسم الرابع: حلول مؤكدة لتفادي خطأ "التطبيق غير مثبت" (App Not Installed) */}
      <div className="rounded-2xl border border-amber-500/40 bg-amber-950/20 p-4 space-y-2.5">
        <h4 className="text-xs font-black text-amber-300 flex items-center gap-1.5">
          <AlertTriangle className="size-4 text-amber-400" />
          دليل التثبيت: كيف تتفادى وتتخلص من رسالة "التطبيق غير مثبت"؟
        </h4>

        <div className="space-y-2 text-[11px] text-amber-100/90 leading-relaxed">
          <div className="rounded-xl border border-amber-500/20 bg-black/40 p-2.5">
            <b className="text-amber-300 block mb-0.5">1. إزالة أي نسخة سابقة:</b>
            إذا كان لديك أو لدى اللاعب نسخة قديمة من لودو، يجب إلغاء تثبيتها أولاً لأن نظام أندرويد
            يرفض التثبيت إذا كانت الشهادات الرقمية مختلفة (Signature Mismatch).
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-black/40 p-2.5">
            <b className="text-amber-300 block mb-0.5">2. السماح بالتثبيت من مصادر غير معروفة:</b>
            من إعدادات الهاتف &gt; الأمان أو التطبيقات &gt; تفعيل خيار{" "}
            <i>"السماح بتثبيت التطبيقات غير المعروفة"</i> لمتصفح كروم أو مدير الملفات.
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-black/40 p-2.5">
            <b className="text-amber-300 block mb-0.5">3. تجاوز حماية Play Protect:</b>
            إذا ظهر تحذير الحماية، اضغط على <b>"مزيد من التفاصيل"</b> ثم{" "}
            <b>"التثبيت على أية حال"</b>.
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-2.5">
            <b className="text-emerald-300 block mb-0.5">4. الحل الأفضل والأسرع (WebAPK):</b>
            أرسل للاعب رابط التطبيق مباشرة، واطلب منه فتح الرابط في متصفح كروم والضغط على
            <b>"تثبيت التطبيق"</b>، وسيتم تثبيته كـ تطبيق هاتف فوري بدون أي رسائل خطأ إطلاقاً!
          </div>
        </div>
      </div>

      {/* القسم الخامس: تصدير حزمة أندرويد ستوديو كملف تكوين */}
      <div className="rounded-2xl border border-white/10 bg-black/40 p-3.5 flex items-center justify-between gap-3">
        <div className="text-right min-w-0">
          <b className="block text-xs font-bold text-white">
            حزمة أندرويد ستوديو (Capacitor Config)
          </b>
          <span className="text-[10px] text-ludo-soft">
            تنزيل بيانات حزمة الأندرويد لبناء APK رسمي موقّع في Android Studio
          </span>
        </div>

        <Button
          variant="ghostGold"
          size="sm"
          onClick={handleExportAndroidBundle}
          className="shrink-0 text-xs font-bold"
        >
          <Package className="size-3.5 ml-1" />
          تصدير الحزمة
        </Button>
      </div>
    </div>
  );
}
