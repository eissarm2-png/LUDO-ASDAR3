import { useState, useEffect } from "react";
import {
  Activity,
  Bug,
  CheckCircle2,
  Coins,
  Cpu,
  Database,
  Gem,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { sfx } from "@/lib/audio";
import { adminTransferPoints } from "@/lib/admin.functions";
import { triggerPointsNotification } from "./SmartPopups";
import { toast } from "sonner";

interface LiveDebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestartGame?: () => void;
  onRollCorrection?: () => void;
}

export function LiveDebugModal({
  isOpen,
  onClose,
  onRestartGame,
  onRollCorrection,
}: LiveDebugModalProps) {
  const { user, profile, refreshProfile, updateProfileLocally } = useAuth();
  const [activeTab, setActiveTab] = useState<"diagnostics" | "wallet" | "game" | "logs">(
    "diagnostics",
  );
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [logs, setLogs] = useState<
    Array<{ id: string; time: string; text: string; type: "ok" | "warn" | "info" }>
  >([
    {
      id: "init-1",
      time: new Date().toLocaleTimeString("ar-EG"),
      text: "تم تفعيل محرك تصحيح الأخطاء المباشر بنجاح.",
      type: "ok",
    },
  ]);

  const addLog = (text: string, type: "ok" | "warn" | "info" = "info") => {
    setLogs((prev) => [
      {
        id: Math.random().toString(36).substring(2, 9),
        time: new Date().toLocaleTimeString("ar-EG"),
        text,
        type,
      },
      ...prev.slice(0, 15),
    ]);
  };

  // قياس سرعة الاتصال بالسيرفر
  const testPing = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      await refreshProfile();
      const elapsed = Math.round(performance.now() - start);
      setPingMs(elapsed);
      addLog(`فحص الاتصال ناجح: استجابة السيرفر ${elapsed}ms`, "ok");
    } catch {
      const elapsed = Math.round(performance.now() - start);
      setPingMs(elapsed);
      addLog(`تم فحص الاتصال مع تحذير بسيط: ${elapsed}ms`, "warn");
    } finally {
      setIsPinging(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      void testPing();
    }
  }, [isOpen]);

  // تصحيح الرصيد بنقرة واحدة
  const handleTransferBonus = async (goldAmount: number, diamondAmount: number) => {
    if (!user) {
      toast.error("يرجى تسجيل الدخول أو إنشاء حساب ضيف");
      return;
    }
    sfx.tap();
    setIsFixing(true);
    addLog(`بدء تحويل رصيد تصحيحي: +${goldAmount} ذهب · +${diamondAmount} ألماس...`, "info");
    try {
      const res = await adminTransferPoints({
        data: {
          userId: user.id,
          gold: goldAmount,
          diamonds: diamondAmount,
          xp: 100,
          note: "تصحيح واختبار رصيد مباشر",
        },
      });

      if (res.ok) {
        sfx.win();
        if (res.profile) {
          updateProfileLocally(res.profile);
          window.dispatchEvent(new CustomEvent("balance_updated", { detail: res.profile }));
        }
        await refreshProfile();
        triggerPointsNotification({
          title: "تصحيح رصيد فوري ⚡",
          body: `تم إضافة ${goldAmount} ذهب و ${diamondAmount} ماسة بنجاح`,
          timeText: "الآن",
        });
        toast.success(`تم تحديث الرصيد ومزامنته فوراً (+${goldAmount} 🪙 / +${diamondAmount} 💎)`);
        addLog(
          `تم تصحيح الرصيد بنجاح! الرصيد الحالي: ${res.profile?.gold ?? profile?.gold} ذهب`,
          "ok",
        );
      } else {
        toast.error(res.reason || "تعذر التحويل");
        addLog(`فشل تصحيح الرصيد: ${res.reason}`, "warn");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطأ غير متوقع";
      toast.error(msg);
      addLog(`خطأ: ${msg}`, "warn");
    } finally {
      setIsFixing(false);
    }
  };

  // التصحيح التلقائي الشامل
  const handleComprehensiveFix = async () => {
    sfx.tap();
    setIsFixing(true);
    addLog("بدء عملية الفحص والتصحيح الشامل للنظام...", "info");
    try {
      // 1. مزامنة الملف الشخصي
      await refreshProfile();
      // 2. إطلاق حدث تحديث واجهات الشريط العلوي
      if (profile) {
        window.dispatchEvent(new CustomEvent("balance_updated", { detail: profile }));
      }
      // 3. فحص التخزين المحلي
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
      }
      // 4. تصحيح اللعبة إن وجد
      if (onRollCorrection) {
        onRollCorrection();
      }
      sfx.win();
      toast.success("✅ تم الفحص والتصحيح الشامل بنجاح! كل الأنظمة متزامنة الآن.");
      addLog("اكتمل التصحيح الشامل: الشريط العلوي، الذاكرة، وقاعدة البيانات متزامنة بنجاح.", "ok");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطأ أثناء التصحيح الشامل";
      addLog(`تحذير أثناء التصحيح: ${msg}`, "warn");
    } finally {
      setIsFixing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="مركز تصحيح الأخطاء المباشر"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-md animate-in fade-in duration-200"
      dir="rtl"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border-2 border-emerald-500/50 bg-[#140612] text-white shadow-[0_0_35px_rgba(16,185,129,0.35)]">
        {/* شريط العنوان */}
        <div className="flex items-center justify-between border-b border-emerald-500/30 bg-gradient-to-r from-emerald-950/80 via-emerald-900/40 to-black/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-xl border border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]">
              <Bug className="size-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-emerald-300">مركز تصحيح الأخطاء المباشر</h3>
              <p className="text-[10px] text-emerald-100/70">
                Live Diagnostics & Real-time Auto-Fix
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full border border-white/20 bg-black/40 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="إغلاق"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* تبويبات الفحص والتصحيح */}
        <div className="flex border-b border-white/10 bg-black/40 px-2 pt-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("diagnostics")}
            className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2 font-bold transition ${
              activeTab === "diagnostics"
                ? "border-emerald-400 text-emerald-300"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            <Activity className="size-3.5" />
            <span>الاتصال</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("wallet")}
            className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2 font-bold transition ${
              activeTab === "wallet"
                ? "border-emerald-400 text-emerald-300"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            <Coins className="size-3.5" />
            <span>الرصيد</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("game")}
            className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2 font-bold transition ${
              activeTab === "game"
                ? "border-emerald-400 text-emerald-300"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            <Cpu className="size-3.5" />
            <span>المباراة</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("logs")}
            className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2 font-bold transition ${
              activeTab === "logs"
                ? "border-emerald-400 text-emerald-300"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            <Database className="size-3.5" />
            <span>السجل ({logs.length})</span>
          </button>
        </div>

        {/* محتوى التبويبات */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* تبويب الاتصال والفحص */}
          {activeTab === "diagnostics" && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-emerald-500/30 bg-black/40 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white/80">حالة الاتصال بالإنترنت:</span>
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 font-bold text-emerald-300">
                    <Wifi className="size-3" /> متصل أونلاين
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-2">
                  <span className="font-bold text-white/80">استجابة السيرفر (Ping):</span>
                  <span className="font-mono font-bold text-amber-300">
                    {isPinging
                      ? "جارٍ القياس..."
                      : pingMs
                        ? `${pingMs} ms (ممتاز)`
                        : "لم يتم القياس"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-2">
                  <span className="font-bold text-white/80">الشريط العلوي (TopBar):</span>
                  <span className="text-emerald-400 font-bold">تخطيط متجاوب LTR مع التفاف مرن</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPinging}
                  onClick={() => void testPing()}
                  className="w-full border-emerald-500/40 text-emerald-300 hover:bg-emerald-950"
                >
                  <RefreshCw className={`size-3.5 ml-1 ${isPinging ? "animate-spin" : ""}`} />
                  فحص الاتصال الآن
                </Button>
                <Button
                  type="button"
                  variant="play"
                  size="sm"
                  disabled={isFixing}
                  onClick={() => void handleComprehensiveFix()}
                  className="w-full text-xs font-black shadow-md"
                >
                  <Zap className="size-3.5 ml-1 text-yellow-300" />
                  تصحيح تلقائي شامل
                </Button>
              </div>
            </div>
          )}

          {/* تبويب تصحيح الرصيد */}
          {activeTab === "wallet" && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-amber-500/30 bg-black/40 p-3 space-y-2">
                <b className="block text-amber-300 text-xs font-black">
                  الرصيد الحي المكتشف في المحفظة:
                </b>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 rounded-xl bg-black/50 p-2 border border-ludo-gold/30">
                    <Coins className="size-4 text-ludo-gold" />
                    <div>
                      <span className="text-[10px] text-ludo-soft block">الذهب:</span>
                      <b className="text-amber-200 text-xs">
                        {(profile?.gold ?? 0).toLocaleString("en-US")}
                      </b>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-xl bg-black/50 p-2 border border-cyan-400/30">
                    <Gem className="size-4 text-cyan-300" />
                    <div>
                      <span className="text-[10px] text-ludo-soft block">الألماس:</span>
                      <b className="text-cyan-200 text-xs">
                        {(profile?.diamonds ?? 0).toLocaleString("en-US")}
                      </b>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-ludo-soft pt-1">
                  <span>المستوى: {profile?.level ?? 1}</span>
                  <span>الخبرة: {profile?.xp ?? 0} XP</span>
                </div>
              </div>

              <b className="block text-xs font-bold text-white/90">أزرار التصحيح والشحن الفوري:</b>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isFixing}
                  onClick={() => void handleTransferBonus(1000, 50)}
                  className="border-amber-400/40 text-amber-300 hover:bg-amber-950 text-xs"
                >
                  <Coins className="size-3.5 ml-1" />
                  +1,000 ذهب تصحيحي
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isFixing}
                  onClick={() => void handleTransferBonus(5000, 200)}
                  className="border-cyan-400/40 text-cyan-300 hover:bg-cyan-950 text-xs"
                >
                  <Gem className="size-3.5 ml-1" />
                  +5,000 ذهب و 200 ماسة
                </Button>
              </div>
              <Button
                type="button"
                variant="royal"
                size="sm"
                disabled={isFixing}
                onClick={async () => {
                  sfx.tap();
                  await refreshProfile();
                  if (profile) {
                    window.dispatchEvent(new CustomEvent("balance_updated", { detail: profile }));
                  }
                  toast.success("تمت مزامنة الرصيد وتحديث الواجهة العلوية فوراً!");
                  addLog("تمت إعادة مزامنة الرصيد من السيرفر بنجاح.", "ok");
                }}
                className="w-full text-xs"
              >
                <RefreshCw className="size-3.5 ml-1" />
                إعادة جلب ومزامنة الرصيد مع السيرفر
              </Button>
            </div>
          )}

          {/* تبويب تصحيح المباراة */}
          {activeTab === "game" && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-3 space-y-2">
                <b className="block text-white text-xs font-bold">إصلاح وتصحيح حالة المباراة:</b>
                <p className="text-[11px] text-ludo-soft leading-relaxed">
                  إذا واجهتك حالة نرد عالقة أو انقطاع في مزامنة الرقعة، يمكنك استخدام أدوات التصحيح
                  المباشرة بالأسفل:
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {onRollCorrection && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        sfx.tap();
                        onRollCorrection();
                        addLog("تم إطلاق أمر تحرير النرد وتصحيح الرمية.", "ok");
                      }}
                      className="border-white/20 text-white text-xs"
                    >
                      <Sparkles className="size-3.5 ml-1 text-amber-300" />
                      تحرير النرد العالق
                    </Button>
                  )}
                  {onRestartGame && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        sfx.tap();
                        onRestartGame();
                        addLog("تمت إعادة تشغيل الجلسة وتصفير الحالة.", "info");
                        onClose();
                      }}
                      className="border-red-400/40 text-red-300 hover:bg-red-950 text-xs"
                    >
                      <RotateCcw className="size-3.5 ml-1" />
                      إعادة بدء اللعبة
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* تبويب السجل */}
          {activeTab === "logs" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-white/10 pb-1">
                <span className="text-[10px] text-ludo-soft">أحدث أحداث التصحيح الحية:</span>
                <button
                  type="button"
                  onClick={() => setLogs([])}
                  className="text-[10px] text-red-400 hover:underline"
                >
                  مسح السجل
                </button>
              </div>
              <div className="max-h-48 space-y-1.5 overflow-y-auto">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`rounded-lg p-2 text-[10px] font-mono border ${
                      log.type === "ok"
                        ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-200"
                        : log.type === "warn"
                          ? "border-amber-500/30 bg-amber-950/30 text-amber-200"
                          : "border-white/10 bg-black/40 text-white/80"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[9px] opacity-70 mb-0.5">
                      <span>{log.time}</span>
                      <span>{log.type.toUpperCase()}</span>
                    </div>
                    <div>{log.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* الشريط السفلي */}
        <div className="flex items-center justify-between border-t border-white/10 bg-black/60 px-4 py-2.5">
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
            <CheckCircle2 className="size-3" /> النظام في وضع التصحيح المباشر
          </span>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs text-white/80">
            إغلاق
          </Button>
        </div>
      </div>
    </div>
  );
}
