import { useCallback, useEffect, useState } from "react";
import {
  Ban,
  BarChart3,
  Coins,
  Gem,
  Gift,
  ListOrdered,
  Megaphone,
  Trash2,
  Search,
  ShieldCheck,
  ShieldX,
  Smartphone,
  Sparkles,
  Store,
  Target,
  Timer,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { sfx } from "@/lib/audio";
import { ApkManagerSection } from "./ApkManagerSection";
import { triggerPointsNotification } from "./SmartPopups";
import {
  adminAdjustEconomy,
  adminCatalog,
  adminGrantItem,
  adminListUsers,
  adminLogs,
  adminRecentMatches,
  adminSaveStoreItem,
  adminSetBan,
  adminSetRole,
  adminStats,
  adminToggleChest,
  adminToggleMission,
  adminTransferPoints,
  adminTurnEvents,
  adminUpdateProfile,
  type AdminStats,
  type AdminUser,
} from "@/lib/admin.functions";
import {
  adminDeleteAnnouncement,
  adminDeleteRoom,
  adminListAnnouncements,
  adminListRooms,
  adminSaveAnnouncement,
  type AdminRoom,
  type Announcement,
} from "@/lib/announcements.functions";

type Tab =
  | "overview"
  | "transfer"
  | "apk"
  | "users"
  | "matches"
  | "rooms"
  | "ads"
  | "catalog"
  | "logs"
  | "turns";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "نظرة عامة", icon: <BarChart3 className="size-4" /> },
  {
    id: "transfer",
    label: "تحويل النقاط الفوري",
    icon: <Gift className="size-4 text-amber-300" />,
  },
  { id: "apk", label: "تحميل وتوزيع APK", icon: <Smartphone className="size-4" /> },
  { id: "users", label: "اللاعبون", icon: <Users className="size-4" /> },
  { id: "matches", label: "المباريات", icon: <ListOrdered className="size-4" /> },
  { id: "rooms", label: "الغرف", icon: <Users className="size-4" /> },
  { id: "ads", label: "الإعلانات", icon: <Megaphone className="size-4" /> },
  { id: "catalog", label: "الكتالوج", icon: <Store className="size-4" /> },
  { id: "logs", label: "سجل الأدمن", icon: <ShieldCheck className="size-4" /> },
  { id: "turns", label: "أحداث الأدوار", icon: <Timer className="size-4" /> },
];

function timeAr(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ar", { dateStyle: "short", timeStyle: "short" });
}

/** لوحة تحكم الأدمن — كل عملية تتحقق من الصلاحية داخل السيرفر وقاعدة البيانات */
export function AdminPanel() {
  const { isAdmin, loading, user } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");

  if (loading) return <p className="py-10 text-center text-ludo-soft">جارٍ التحقق من الصلاحيات…</p>;

  if (!user || !isAdmin) {
    return (
      <div className="coin-card space-y-2 text-center">
        <ShieldX className="mx-auto size-10 text-ludo-pink" />
        <b className="block text-ludo-gold">هذه المنطقة للمشرفين فقط</b>
        <p className="text-xs text-ludo-soft">
          سجّل الدخول بحساب لديه صلاحية إدارية. الصلاحية تُمنح وتُتحقق في السيرفر ولا يمكن تجاوزها
          من المتصفح.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <nav className="chat-tabs flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              sfx.tap();
            }}
            className={cn("chat-tab press-3d", tab === t.id && "chat-tab-active")}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {tab === "overview" && <Overview onGoToApk={() => setTab("apk")} />}
      {tab === "transfer" && <TransferPointsTab />}
      {tab === "apk" && <ApkManagerSection />}
      {tab === "users" && <UsersTab />}
      {tab === "matches" && <MatchesTab />}
      {tab === "rooms" && <RoomsTab />}
      {tab === "ads" && <AdsTab />}
      {tab === "catalog" && <CatalogTab />}
      {tab === "logs" && <LogsTab />}
      {tab === "turns" && <TurnsTab />}
    </div>
  );
}

function Overview({ onGoToApk }: { onGoToApk?: () => void }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    void adminStats()
      .then((r) => {
        if (r.ok && r.stats) setStats(r.stats);
        else setError(true);
      })
      .catch(() => setError(true));
  }, []);

  if (error)
    return <p className="coin-card text-center text-xs text-ludo-pink">تعذّر تحميل الإحصائيات</p>;
  if (!stats) return <p className="py-6 text-center text-ludo-soft">جارٍ التحميل…</p>;

  const cells: [string, number | string][] = [
    ["اللاعبون", stats.users],
    ["الموقوفون", stats.banned],
    ["المشرفون", stats.admins],
    ["كل المباريات", stats.matches],
    ["آخر ٢٤ ساعة", stats.matches_24h],
    ["مباريات لودو", stats.ludo_matches],
    ["مباريات دومينو", stats.domino_matches],
    ["إجمالي الذهب", stats.gold],
    ["إجمالي الألماس", stats.diamonds],
  ];

  return (
    <div className="space-y-3">
      {/* بطاقة سريعة للأدمن لتحميل ومشاركة APK */}
      {onGoToApk && (
        <div className="rounded-2xl border-2 border-ludo-gold/70 bg-gradient-to-r from-[#440d39] via-[#24051f] to-[#120110] p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3 text-right">
            <div className="grid size-11 place-items-center rounded-xl border border-ludo-gold bg-ludo-gold/20 text-ludo-gold shrink-0">
              <Smartphone className="size-6 animate-pulse" />
            </div>
            <div>
              <b className="text-sm font-black text-ludo-gold block">
                تحميل ومشاركة ملف APK والتطبيق
              </b>
              <span className="text-[11px] text-ludo-soft">
                رابط التنزيل المباشر، تثبيت فوري بدون خطأ "التطبيق غير مثبت"، ومشاركة للاعبين.
              </span>
            </div>
          </div>
          <Button
            variant="play"
            size="sm"
            onClick={onGoToApk}
            className="shrink-0 text-xs font-black shadow-md w-full sm:w-auto"
          >
            فتح قسم تحميل APK 📲
          </Button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {cells.map(([label, value]) => (
          <div key={label} className="coin-card p-3 text-center">
            <b className="block text-lg text-ludo-gold">{value}</b>
            <small className="text-[10px] text-ludo-soft">{label}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

type TransferLog = {
  id: string;
  targetName: string;
  amountText: string;
  time: string;
  status: string;
};

/** قسم تحويل النقاط الفوري والذكي مع التحقق الشامل */
function TransferPointsTab() {
  const {
    user: adminUser,
    profile: adminProfile,
    updateProfileLocally,
    refreshProfile,
  } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [targetType, setTargetType] = useState<"self" | "other">("self");
  const [selectedUserId, setSelectedUserId] = useState<string>(adminUser?.id ?? "");
  const [userSearch, setUserSearch] = useState("");
  const [gold, setGold] = useState("500");
  const [diamonds, setDiamonds] = useState("50");
  const [xp, setXp] = useState("100");
  const [note, setNote] = useState("شحن ومكافأة إدارية فورية");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
    balance?: string;
  } | null>(null);
  const [transferLogs, setTransferLogs] = useState<TransferLog[]>([]);

  useEffect(() => {
    setLoadingUsers(true);
    void adminListUsers({ data: { limit: 50, offset: 0 } })
      .then((r) => {
        if (r.ok && r.users) setUsers(r.users);
      })
      .finally(() => setLoadingUsers(false));
  }, []);

  const effectiveUserId = targetType === "self" ? (adminUser?.id ?? "") : selectedUserId;
  const targetUserObj = users.find((u) => u.id === effectiveUserId);
  const targetName =
    targetType === "self"
      ? adminProfile?.display_name || "حسابي (المسؤول الحالي)"
      : targetUserObj?.display_name || "لاعب مختار";

  const applyPreset = (goldVal: number, diamondVal: number, xpVal: number) => {
    sfx.tap();
    setGold(String(goldVal));
    setDiamonds(String(diamondVal));
    setXp(String(xpVal));
  };

  const handleExecuteTransfer = async () => {
    if (!effectiveUserId) {
      setFeedback({ ok: false, message: "يرجى تحديد حساب المستلم لإتمام التحويل" });
      return;
    }
    const numGold = Number(gold) || 0;
    const numDiamonds = Number(diamonds) || 0;
    const numXp = Number(xp) || 0;

    if (numGold === 0 && numDiamonds === 0 && numXp === 0) {
      setFeedback({ ok: false, message: "يرجى إدخال كمية ذهب أو ألماس أو نقاط خبرة للتحويل" });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await adminTransferPoints({
        data: {
          userId: effectiveUserId,
          gold: numGold,
          diamonds: numDiamonds,
          xp: numXp,
          note: note.trim() || "تحويل إداري فوري",
        },
      });

      if (res.ok) {
        sfx.win();
        const balanceText = res.profile
          ? `الرصيد الجديد: ${res.profile.gold.toLocaleString("en-US")} ذهب · ${res.profile.diamonds.toLocaleString("en-US")} ألماس`
          : undefined;

        setFeedback({
          ok: true,
          message: `✅ تم التحويل بنجاح لحساب (${targetName})! تم تحديث قاعدة البيانات فوراً.`,
          balance: balanceText,
        });

        // المزامنة الفورية للمحفظة في حال كان التحويل للمسؤول نفسه
        if (res.profile && (res.isSelf || effectiveUserId === adminUser?.id)) {
          updateProfileLocally(res.profile);
          window.dispatchEvent(new CustomEvent("balance_updated", { detail: res.profile }));
        }

        // إطلاق نافذة الإشعار الذكية المنبثقة وتنبيه الجهاز
        if (res.notification) {
          triggerPointsNotification({
            title: res.notification.title,
            body: res.notification.body,
            timeText: "الآن",
          });
        }

        await refreshProfile();

        // إضافة إلى جدول السجلات الحية للمسؤول
        setTransferLogs((prev) => [
          {
            id: `TX-${Date.now().toString(36).toUpperCase()}`,
            targetName,
            amountText: `${numGold > 0 ? `+${numGold} 🪙 ` : ""}${numDiamonds > 0 ? `+${numDiamonds} 💎 ` : ""}${numXp > 0 ? `+${numXp} ⭐` : ""}`,
            time: new Date().toLocaleTimeString("ar-EG"),
            status: "تم بنجاح وموثق في السجلات",
          },
          ...prev.slice(0, 7),
        ]);
      } else {
        setFeedback({
          ok: false,
          message: res.reason || "فشلت عملية التحويل. يرجى التحقق من الاتصال والصلاحيات.",
        });
      }
    } catch (err: unknown) {
      const errMessage =
        err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء معالجة التحويل.";
      setFeedback({
        ok: false,
        message: errMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.display_name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()),
  );

  return (
    <div className="space-y-4" dir="rtl">
      {/* بطاقة خطوات التحقق المعتمدة */}
      <div className="rounded-2xl border border-ludo-gold/40 bg-gradient-to-br from-[#4a103c] via-[#24051d] to-[#12010e] p-4 shadow-lg space-y-2">
        <div className="flex items-center gap-2 text-ludo-gold">
          <ShieldCheck className="size-5" />
          <h3 className="text-sm font-black">نظام تحويل النقاط الذكي (5 مراحل موثقة)</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-ludo-soft pt-1">
          <div className="flex items-center gap-1.5">
            <span className="grid size-4 place-items-center rounded-full bg-emerald-500/20 text-[9px] font-bold text-emerald-400">
              1
            </span>
            <span>التحقق من حساب المستلم في قاعدة البيانات</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="grid size-4 place-items-center rounded-full bg-emerald-500/20 text-[9px] font-bold text-emerald-400">
              2
            </span>
            <span>تنفيذ التحويل الذري (Atomic DB update)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="grid size-4 place-items-center rounded-full bg-emerald-500/20 text-[9px] font-bold text-emerald-400">
              3
            </span>
            <span>حفظ وتوثيق العملية في سجلات الإدارة</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="grid size-4 place-items-center rounded-full bg-emerald-500/20 text-[9px] font-bold text-emerald-400">
              4
            </span>
            <span>المزامنة الفورية للرصيد مع الواجهة والشريط العلوي</span>
          </div>
          <div className="flex items-center gap-1.5 sm:col-span-2">
            <span className="grid size-4 place-items-center rounded-full bg-emerald-500/20 text-[9px] font-bold text-emerald-400">
              5
            </span>
            <span>إنشاء إشعار تفاعلي فوري وتنبيه الجهاز</span>
          </div>
        </div>
      </div>

      {/* اختيار الحساب المستهدف */}
      <div className="coin-card space-y-3">
        <b className="block text-xs font-black text-ludo-gold">1. تحديد حساب المستلم:</b>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              sfx.tap();
              setTargetType("self");
            }}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition active:scale-95 text-xs font-bold",
              targetType === "self"
                ? "border-ludo-gold bg-ludo-gold/20 text-white shadow-[0_0_15px_rgba(255,215,0,0.3)]"
                : "border-white/10 bg-black/40 text-ludo-soft hover:border-white/20",
            )}
          >
            <span className="text-base mb-0.5">👑</span>
            <span>حسابي (المسؤول الحالي)</span>
            <small className="text-[10px] text-amber-300/80 mt-1">
              رصيدك: {adminProfile?.gold ?? 0} ذهب · {adminProfile?.diamonds ?? 0} ألماس
            </small>
          </button>

          <button
            type="button"
            onClick={() => {
              sfx.tap();
              setTargetType("other");
            }}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition active:scale-95 text-xs font-bold",
              targetType === "other"
                ? "border-ludo-gold bg-ludo-gold/20 text-white shadow-[0_0_15px_rgba(255,215,0,0.3)]"
                : "border-white/10 bg-black/40 text-ludo-soft hover:border-white/20",
            )}
          >
            <span className="text-base mb-0.5">👥</span>
            <span>اختيار لاعب آخر</span>
            <small className="text-[10px] text-ludo-soft mt-1">من قائمة اللاعبين المسجلين</small>
          </button>
        </div>

        {targetType === "other" && (
          <div className="space-y-2 pt-2 border-t border-white/10">
            <Input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="ابحث عن لاعب بالاسم أو البريد..."
              className="text-xs"
            />
            {loadingUsers ? (
              <p className="text-xs text-center text-ludo-soft py-2">جارٍ جلب اللاعبين...</p>
            ) : (
              <select
                className="chat-input text-xs w-full"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">-- اختر لاعباً من القائمة --</option>
                {filteredUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.display_name} ({u.gold} ذهب · {u.diamonds} ألماس) - {u.email}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* كميات الرصيد المقترحة والمدخلة */}
      <div className="coin-card space-y-3">
        <div className="flex items-center justify-between">
          <b className="text-xs font-black text-ludo-gold">2. تحديد كمية النقاط والمكافآت:</b>
          <span className="text-[10px] text-ludo-soft">أزرار سريعة بنقرة واحدة</span>
        </div>

        {/* أزرار سريعة */}
        <div className="grid grid-cols-5 gap-1.5">
          <button
            type="button"
            onClick={() => applyPreset(100, 10, 20)}
            className="rounded-lg border border-ludo-gold/40 bg-black/50 py-1.5 text-[10px] font-bold text-amber-200 transition hover:bg-ludo-gold/20 active:scale-95"
          >
            +100
          </button>
          <button
            type="button"
            onClick={() => applyPreset(500, 50, 100)}
            className="rounded-lg border border-ludo-gold/40 bg-black/50 py-1.5 text-[10px] font-bold text-amber-200 transition hover:bg-ludo-gold/20 active:scale-95"
          >
            +500
          </button>
          <button
            type="button"
            onClick={() => applyPreset(1000, 100, 250)}
            className="rounded-lg border border-ludo-gold/40 bg-black/50 py-1.5 text-[10px] font-bold text-amber-200 transition hover:bg-ludo-gold/20 active:scale-95"
          >
            +1,000
          </button>
          <button
            type="button"
            onClick={() => applyPreset(5000, 500, 1000)}
            className="rounded-lg border border-ludo-gold/40 bg-black/50 py-1.5 text-[10px] font-bold text-amber-200 transition hover:bg-ludo-gold/20 active:scale-95"
          >
            +5,000
          </button>
          <button
            type="button"
            onClick={() => applyPreset(10000, 1000, 2000)}
            className="rounded-lg border border-ludo-gold/40 bg-black/50 py-1.5 text-[10px] font-bold text-amber-200 transition hover:bg-ludo-gold/20 active:scale-95"
          >
            +10,000
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <label className="text-[10px] font-bold text-ludo-gold">
            🪙 الذهب
            <Input
              value={gold}
              onChange={(e) => setGold(e.target.value)}
              inputMode="numeric"
              className="text-xs font-bold"
            />
          </label>
          <label className="text-[10px] font-bold text-cyan-400">
            💎 الألماس
            <Input
              value={diamonds}
              onChange={(e) => setDiamonds(e.target.value)}
              inputMode="numeric"
              className="text-xs font-bold"
            />
          </label>
          <label className="text-[10px] font-bold text-purple-300">
            ⭐ نقاط خبرة XP
            <Input
              value={xp}
              onChange={(e) => setXp(e.target.value)}
              inputMode="numeric"
              className="text-xs font-bold"
            />
          </label>
        </div>

        <label className="block text-[10px] text-ludo-soft pt-1">
          ملاحظة العملية (تظهر في سجل الإشعار):
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={60}
            className="text-xs"
            placeholder="مثال: مكافأة فوز بالبطولة الإدارية"
          />
        </label>
      </div>

      {/* زر التنفيذ المباشر */}
      <div className="space-y-2">
        <Button
          variant="play"
          size="xl"
          disabled={isSubmitting}
          onClick={() => void handleExecuteTransfer()}
          className="w-full text-sm font-black shadow-lg"
        >
          {isSubmitting ? (
            "جارٍ تنفيذ التحويل وتحديث قاعدة البيانات..."
          ) : (
            <>
              <Coins className="size-5 ml-1 animate-bounce" />
              تنفيذ التحويل وتحديث الرصيد فوراً ⚡
            </>
          )}
        </Button>

        {feedback && (
          <div
            className={cn(
              "rounded-xl p-3 text-xs font-bold space-y-1 animate-in fade-in duration-200",
              feedback.ok
                ? "border border-emerald-400/50 bg-emerald-950/60 text-emerald-200"
                : "border border-red-400/50 bg-red-950/60 text-red-200",
            )}
          >
            <p>{feedback.message}</p>
            {feedback.balance && <p className="text-amber-300 font-black">{feedback.balance}</p>}
          </div>
        )}
      </div>

      {/* سجل التحويلات المنفذة في هذه الجلسة */}
      {transferLogs.length > 0 && (
        <div className="coin-card space-y-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <b className="text-xs font-black text-ludo-gold">سجل العمليات المنفذة حديثاً:</b>
            <span className="text-[10px] text-ludo-soft">{transferLogs.length} عمليات</span>
          </div>
          <div className="space-y-1.5">
            {transferLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-lg bg-black/40 p-2 text-[11px] border border-white/5"
              >
                <div>
                  <b className="text-white block">{log.targetName}</b>
                  <span className="text-[10px] text-amber-300">{log.amountText}</span>
                </div>
                <div className="text-left">
                  <span className="block text-[10px] text-emerald-400">{log.status}</span>
                  <span className="text-[9px] text-ludo-soft">{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UsersTab() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<AdminUser | null>(null);

  const load = useCallback(async (q: string) => {
    setBusy(true);
    const r = await adminListUsers({ data: { search: q, limit: 40, offset: 0 } });
    const newUsers = r.ok ? r.users : [];
    setUsers(newUsers);
    setSelected((prev) => (prev ? (newUsers.find((u) => u.id === prev.id) ?? prev) : null));
    setBusy(false);
  }, []);

  useEffect(() => {
    void load("");
  }, [load]);

  return (
    <div className="space-y-3">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void load(search);
        }}
      >
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث بالاسم أو البريد"
        />
        <Button type="submit" variant="royal" size="icon" aria-label="بحث">
          <Search />
        </Button>
      </form>

      {busy && <p className="text-center text-xs text-ludo-soft">جارٍ التحميل…</p>}

      <div className="space-y-2">
        {users.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => setSelected(u)}
            className={cn(
              "coin-card w-full text-right press-3d",
              selected?.id === u.id && "ring-2 ring-ludo-gold",
            )}
          >
            <span className="flex items-center gap-2">
              <span className="avatar-orb bg-ludo-gold text-xl">{u.avatar}</span>
              <span className="min-w-0 flex-1">
                <b className="block truncate text-ludo-gold">{u.display_name}</b>
                <small className="block truncate text-[10px] text-ludo-soft">{u.email}</small>
              </span>
              <span className="text-[10px] text-ludo-soft">
                <span className="block">
                  لفل {u.level} · {u.points} نقطة
                </span>
                <span className="block">
                  {u.gold} ذهب · {u.diamonds} ألماس
                </span>
              </span>
            </span>
            <span className="mt-1 flex flex-wrap gap-1 text-[10px]">
              {u.is_admin && (
                <b className="rounded bg-ludo-gold/20 px-2 py-0.5 text-ludo-gold">أدمن</b>
              )}
              {u.banned && (
                <b className="rounded bg-destructive/25 px-2 py-0.5 text-destructive-foreground">
                  موقوف
                </b>
              )}
              <span className="text-ludo-soft">انضم {timeAr(u.created_at)}</span>
            </span>
          </button>
        ))}
        {!busy && users.length === 0 && (
          <p className="text-center text-xs text-ludo-soft">لا نتائج</p>
        )}
      </div>

      {selected && <UserActions user={selected} onDone={() => void load(search)} />}
    </div>
  );
}

function UserActions({ user, onDone }: { user: AdminUser; onDone: () => void }) {
  const { user: currentAuthUser, updateProfileLocally, refreshProfile } = useAuth();
  const [gold, setGold] = useState("0");
  const [diamonds, setDiamonds] = useState("0");
  const [xp, setXp] = useState("0");
  const [name, setName] = useState(user.display_name);
  const [avatar, setAvatar] = useState(user.avatar);
  const [reason, setReason] = useState(user.banned_reason ?? "");
  const [itemKind, setItemKind] = useState<"avatar" | "banner" | "frame">("frame");
  const [itemCode, setItemCode] = useState("diamond-elite");
  const [msg, setMsg] = useState<string | null>(null);

  const run = async (
    fn: () => Promise<{
      ok: boolean;
      reason?: string;
      profile?: { id: string; gold: number; diamonds: number; xp: number; level: number };
      isSelf?: boolean;
      notification?: { title: string; body: string };
    }>,
    okText: string,
  ) => {
    setMsg(null);
    try {
      const r = await fn();
      if (r.ok) {
        sfx.win();
        setMsg(okText);
        setGold("0");
        setDiamonds("0");
        setXp("0");
        if (r.profile && (r.isSelf || user.id === currentAuthUser?.id)) {
          updateProfileLocally(r.profile);
          window.dispatchEvent(new CustomEvent("balance_updated", { detail: r.profile }));
        }
        if (r.notification) {
          triggerPointsNotification({
            title: r.notification.title,
            body: r.notification.body,
            timeText: "الآن",
          });
        }
        await refreshProfile();
        onDone();
      } else {
        setMsg(r.reason || "العملية مرفوضة — تحقق من صلاحياتك");
      }
    } catch {
      setMsg("العملية مرفوضة");
    }
  };

  return (
    <div className="coin-card space-y-3">
      <div className="flex items-center justify-between">
        <b className="text-ludo-gold">إدارة: {user.display_name}</b>
        <span className="text-[10px] text-ludo-soft">
          {user.gold} ذهب · {user.diamonds} ألماس
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <label className="text-[10px] text-ludo-soft">
          ذهب
          <Input value={gold} onChange={(e) => setGold(e.target.value)} inputMode="numeric" />
        </label>
        <label className="text-[10px] text-ludo-soft">
          ألماس
          <Input
            value={diamonds}
            onChange={(e) => setDiamonds(e.target.value)}
            inputMode="numeric"
          />
        </label>
        <label className="text-[10px] text-ludo-soft">
          XP
          <Input value={xp} onChange={(e) => setXp(e.target.value)} inputMode="numeric" />
        </label>
      </div>
      <Button
        variant="play"
        className="w-full"
        onClick={() =>
          void run(
            () =>
              adminTransferPoints({
                data: {
                  userId: user.id,
                  gold: Number(gold) || 0,
                  diamonds: Number(diamonds) || 0,
                  xp: Number(xp) || 0,
                  note: "تعديل إداري فوري",
                },
              }),
            "تم تحديث الرصيد بنجاح",
          )
        }
      >
        <Coins /> تطبيق تعديل الرصيد
      </Button>

      <div className="grid grid-cols-2 gap-2">
        <Input
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          placeholder="الاسم الظاهر"
        />
        <Input
          value={avatar}
          maxLength={4}
          onChange={(e) => setAvatar(e.target.value)}
          placeholder="الأفاتار"
        />
      </div>
      <Button
        variant="royal"
        className="w-full"
        onClick={() =>
          void run(
            () => adminUpdateProfile({ data: { userId: user.id, displayName: name, avatar } }),
            "تم تحديث الملف",
          )
        }
      >
        <Sparkles /> حفظ الملف الشخصي
      </Button>

      <div className="grid grid-cols-3 gap-2">
        <select
          className="chat-input"
          value={itemKind}
          onChange={(e) => setItemKind(e.target.value as "avatar" | "banner" | "frame")}
        >
          <option value="avatar">أفاتار</option>
          <option value="banner">بنر</option>
          <option value="frame">إطار</option>
        </select>
        <Input
          className="col-span-2"
          value={itemCode}
          onChange={(e) => setItemCode(e.target.value)}
          placeholder="رمز العنصر"
        />
      </div>
      <Button
        variant="neon"
        className="w-full"
        onClick={() =>
          void run(
            () =>
              adminGrantItem({
                data: { userId: user.id, kind: itemKind, code: itemCode, rarity: "legendary" },
              }),
            "تم منح العنصر",
          )
        }
      >
        <Gift /> منح عنصر ملكي
      </Button>

      <Input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="سبب الإيقاف (اختياري)"
      />
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={user.banned ? "royal" : "ghostGold"}
          onClick={() =>
            void run(
              () => adminSetBan({ data: { userId: user.id, banned: !user.banned, reason } }),
              user.banned ? "تم فك الإيقاف" : "تم إيقاف الحساب",
            )
          }
        >
          <Ban /> {user.banned ? "فك الإيقاف" : "إيقاف الحساب"}
        </Button>
        <Button
          variant="neon"
          onClick={() =>
            void run(
              () =>
                adminSetRole({ data: { userId: user.id, role: "admin", grant: !user.is_admin } }),
              user.is_admin ? "تم سحب صلاحية الأدمن" : "تم منح صلاحية الأدمن",
            )
          }
        >
          <ShieldCheck /> {user.is_admin ? "سحب الأدمن" : "منح الأدمن"}
        </Button>
      </div>

      {msg && <p className="text-center text-xs text-ludo-soft">{msg}</p>}
    </div>
  );
}

type MatchRow = {
  id: string;
  display_name: string | null;
  mode: string;
  result: string;
  players: number;
  points: number;
  moves: number;
  duration_ms: number;
  created_at: string;
};

function MatchesTab() {
  const [rows, setRows] = useState<MatchRow[]>([]);
  useEffect(() => {
    void adminRecentMatches({ data: { limit: 60 } }).then((r) =>
      setRows((r.matches ?? []) as MatchRow[]),
    );
  }, []);
  return (
    <div className="space-y-2">
      {rows.map((m) => (
        <div key={m.id} className="coin-card flex items-center gap-2 text-xs">
          <b
            className={cn(
              "rounded px-2 py-1",
              m.result === "win"
                ? "bg-ludo-palm/25 text-ludo-palm"
                : "bg-destructive/20 text-destructive-foreground",
            )}
          >
            {m.result === "win" ? "فوز" : "خسارة"}
          </b>
          <span className="min-w-0 flex-1">
            <b className="block truncate text-ludo-gold">{m.display_name ?? "لاعب"}</b>
            <small className="text-ludo-soft">
              {m.mode === "domino" ? "دومينو" : "لودو"} · {m.players} لاعبين · {m.moves} حركة
            </small>
          </span>
          <span className="text-left text-[10px] text-ludo-soft">
            <span className="block">{m.points} نقطة</span>
            <span className="block">{timeAr(m.created_at)}</span>
          </span>
        </div>
      ))}
      {rows.length === 0 && <p className="text-center text-xs text-ludo-soft">لا مباريات بعد</p>}
    </div>
  );
}

type CatalogState = {
  chests: {
    code: string;
    title: string;
    cost_gold: number;
    cost_diamonds: number;
    active: boolean;
  }[];
  missions: {
    code: string;
    title: string;
    period: string;
    goal: number;
    reward_gold: number;
    active: boolean;
  }[];
  store: {
    code: string;
    title: string;
    kind: string;
    cost_gold: number;
    cost_diamonds: number;
    active: boolean;
  }[];
};

function CatalogTab() {
  const [data, setData] = useState<CatalogState | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    code: "",
    title: "",
    kind: "frame",
    value: "",
    gold: "0",
    diamonds: "0",
  });

  const load = useCallback(async () => {
    const r = await adminCatalog();
    setData(r as unknown as CatalogState);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  if (!data) return <p className="py-6 text-center text-ludo-soft">جارٍ التحميل…</p>;

  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <h3 className="text-sm text-ludo-gold">الصناديق</h3>
        {data.chests.map((c) => (
          <div key={c.code} className="coin-card flex items-center gap-2 text-xs">
            <span className="min-w-0 flex-1">
              <b className="block truncate text-ludo-gold">{c.title}</b>
              <small className="text-ludo-soft">
                {c.cost_gold} ذهب · {c.cost_diamonds} ألماس
              </small>
            </span>
            <Button
              variant={c.active ? "royal" : "ghostGold"}
              size="sm"
              onClick={async () => {
                const r = await adminToggleChest({
                  data: {
                    code: c.code,
                    active: !c.active,
                    costGold: c.cost_gold,
                    costDiamonds: c.cost_diamonds,
                  },
                });
                setMsg(r.ok ? "تم التحديث" : "مرفوض");
                if (r.ok) void load();
              }}
            >
              {c.active ? "مُفعّل" : "موقوف"}
            </Button>
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm text-ludo-gold">المهام</h3>
        {data.missions.map((m) => (
          <div key={m.code} className="coin-card flex items-center gap-2 text-xs">
            <Target className="size-4 text-ludo-pink" />
            <span className="min-w-0 flex-1">
              <b className="block truncate text-ludo-gold">{m.title}</b>
              <small className="text-ludo-soft">
                {m.period === "weekly" ? "أسبوعية" : "يومية"} · الهدف {m.goal} · {m.reward_gold} ذهب
              </small>
            </span>
            <Button
              variant={m.active ? "royal" : "ghostGold"}
              size="sm"
              onClick={async () => {
                const r = await adminToggleMission({
                  data: {
                    code: m.code,
                    active: !m.active,
                    goal: m.goal,
                    rewardGold: m.reward_gold,
                  },
                });
                setMsg(r.ok ? "تم التحديث" : "مرفوض");
                if (r.ok) void load();
              }}
            >
              {m.active ? "مُفعّلة" : "موقوفة"}
            </Button>
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm text-ludo-gold">المتجر</h3>
        {data.store.map((s) => (
          <div key={s.code} className="coin-card flex items-center gap-2 text-xs">
            <Gem className="size-4 text-ludo-lagoon" />
            <span className="min-w-0 flex-1">
              <b className="block truncate text-ludo-gold">{s.title}</b>
              <small className="text-ludo-soft">
                {s.kind} · {s.cost_gold} ذهب · {s.cost_diamonds} ألماس
              </small>
            </span>
            <Button
              variant={s.active ? "royal" : "ghostGold"}
              size="sm"
              onClick={async () => {
                const r = await adminSaveStoreItem({
                  data: {
                    code: s.code,
                    title: s.title,
                    kind: s.kind as "avatar" | "banner" | "frame",
                    costGold: s.cost_gold,
                    costDiamonds: s.cost_diamonds,
                    active: !s.active,
                  },
                });
                setMsg(r.ok ? "تم التحديث" : "مرفوض");
                if (r.ok) void load();
              }}
            >
              {s.active ? "معروض" : "مخفي"}
            </Button>
          </div>
        ))}

        <div className="coin-card space-y-2">
          <b className="block text-xs text-ludo-gold">إضافة عنصر متجر</b>
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={newItem.code}
              onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
              placeholder="الرمز (حروف صغيرة)"
            />
            <Input
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              placeholder="العنوان"
            />
            <select
              className="chat-input"
              value={newItem.kind}
              onChange={(e) => setNewItem({ ...newItem, kind: e.target.value })}
            >
              <option value="avatar">أفاتار</option>
              <option value="banner">بنر</option>
              <option value="frame">إطار</option>
            </select>
            <Input
              value={newItem.value}
              onChange={(e) => setNewItem({ ...newItem, value: e.target.value })}
              placeholder="القيمة"
            />
            <Input
              value={newItem.gold}
              onChange={(e) => setNewItem({ ...newItem, gold: e.target.value })}
              placeholder="ذهب"
              inputMode="numeric"
            />
            <Input
              value={newItem.diamonds}
              onChange={(e) => setNewItem({ ...newItem, diamonds: e.target.value })}
              placeholder="ألماس"
              inputMode="numeric"
            />
          </div>
          <Button
            variant="play"
            className="w-full"
            onClick={async () => {
              try {
                const r = await adminSaveStoreItem({
                  data: {
                    code: newItem.code.trim().toLowerCase(),
                    title: newItem.title,
                    kind: newItem.kind as "avatar" | "banner" | "frame",
                    value: newItem.value,
                    costGold: Number(newItem.gold) || 0,
                    costDiamonds: Number(newItem.diamonds) || 0,
                    active: true,
                  },
                });
                setMsg(r.ok ? "تمت الإضافة" : "مرفوض");
                if (r.ok) void load();
              } catch {
                setMsg("تحقق من صحة الرمز (a-z و - فقط)");
              }
            }}
          >
            <Store /> حفظ العنصر
          </Button>
        </div>
      </section>

      {msg && <p className="text-center text-xs text-ludo-soft">{msg}</p>}
    </div>
  );
}

type LogRow = {
  id: string;
  admin_name: string | null;
  action: string;
  target_name: string | null;
  detail: unknown;
  created_at: string;
};

function LogsTab() {
  const [rows, setRows] = useState<LogRow[]>([]);
  useEffect(() => {
    void adminLogs({ data: { limit: 80 } }).then((r) => setRows((r.logs ?? []) as LogRow[]));
  }, []);
  return (
    <div className="space-y-2">
      {rows.map((l) => (
        <div key={l.id} className="coin-card text-xs">
          <b className="text-ludo-gold">{l.action}</b>
          <p className="text-ludo-soft">
            بواسطة {l.admin_name ?? "أدمن"} {l.target_name ? `— الهدف: ${l.target_name}` : ""}
          </p>
          <small className="text-[10px] text-ludo-soft">{timeAr(l.created_at)}</small>
        </div>
      ))}
      {rows.length === 0 && <p className="text-center text-xs text-ludo-soft">لا عمليات مسجّلة</p>}
    </div>
  );
}

type TurnRow = {
  id: string;
  display_name: string | null;
  match_id: string;
  turn: number;
  kind: string;
  elapsed_ms: number;
  limit_ms: number;
  accepted: boolean;
  reason: string | null;
  created_at: string;
};

function TurnsTab() {
  const [rows, setRows] = useState<TurnRow[]>([]);
  useEffect(() => {
    void adminTurnEvents({ data: { limit: 80 } }).then((r) =>
      setRows((r.events ?? []) as TurnRow[]),
    );
  }, []);
  return (
    <div className="space-y-2">
      {rows.map((e) => (
        <div key={e.id} className="coin-card flex items-center gap-2 text-xs">
          <Timer className={cn("size-4", e.accepted ? "text-ludo-palm" : "text-ludo-pink")} />
          <span className="min-w-0 flex-1">
            <b className="block truncate text-ludo-gold">
              {e.display_name ?? "لاعب"} · دور {e.turn}
            </b>
            <small className="text-ludo-soft">
              {e.kind} · {(e.elapsed_ms / 1000).toFixed(1)}ث من {(e.limit_ms / 1000).toFixed(0)}ث
              {e.reason ? ` · ${e.reason}` : ""}
            </small>
          </span>
          <small className="text-[10px] text-ludo-soft">{timeAr(e.created_at)}</small>
        </div>
      ))}
      {rows.length === 0 && <p className="text-center text-xs text-ludo-soft">لا أحداث مسجّلة</p>}
    </div>
  );
}

/** إدارة الغرف: عرض الغرف الحيّة وحذف أي غرفة */
function RoomsTab() {
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await adminListRooms();
    setRooms(r.rooms);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-2">
      {rooms.map((r) => (
        <div key={r.id} className="coin-card flex items-center gap-2 text-xs">
          <span className="min-w-0 flex-1">
            <b className="block truncate text-ludo-gold">{r.name}</b>
            <small className="block text-ludo-soft">
              كود {r.code} · {r.mode === "domino" ? "دومينو" : "لودو"} · {r.members}/{r.max_players}{" "}
              لاعب
            </small>
            <small className="block text-[10px] text-ludo-soft">
              المضيف {r.host_name ?? "—"} · {r.status === "lobby" ? "انتظار" : "جارية"} ·{" "}
              {r.is_public ? "عامة" : "خاصة"}
            </small>
          </span>
          <Button
            variant="ghostGold"
            size="sm"
            aria-label="حذف الغرفة"
            onClick={async () => {
              const res = await adminDeleteRoom({ data: { id: r.id } });
              setMsg(res.ok ? "تم حذف الغرفة" : "مرفوض");
              if (res.ok) void load();
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      {rooms.length === 0 && <p className="text-center text-xs text-ludo-soft">لا غرف حاليًا</p>}
      {msg && <p className="text-center text-xs text-ludo-soft">{msg}</p>}
    </div>
  );
}

/** إدارة الإعلانات: تظهر مباشرة في الواجهة الرئيسية لكل اللاعبين */
function AdsTab() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await adminListAnnouncements();
    setItems(r.items);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-3">
      <div className="coin-card space-y-2">
        <b className="block text-xs text-ludo-gold">إعلان جديد</b>
        <Input
          value={title}
          maxLength={80}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="العنوان"
        />
        <Input
          value={body}
          maxLength={300}
          onChange={(e) => setBody(e.target.value)}
          placeholder="النص"
        />
        <Input
          value={link}
          maxLength={200}
          onChange={(e) => setLink(e.target.value)}
          placeholder="رابط (اختياري)"
        />
        <Button
          variant="play"
          className="w-full"
          onClick={async () => {
            if (!title.trim()) {
              setMsg("اكتب عنوانًا");
              return;
            }
            const r = await adminSaveAnnouncement({
              data: { title, body, link, kind: "banner", active: true },
            });
            setMsg(r.ok ? "تم نشر الإعلان" : "مرفوض");
            if (r.ok) {
              setTitle("");
              setBody("");
              setLink("");
              sfx.tap();
              void load();
            }
          }}
        >
          <Sparkles /> نشر الإعلان
        </Button>
      </div>

      {items.map((a) => (
        <div key={a.id} className="coin-card flex items-start gap-2 text-xs">
          <span className="min-w-0 flex-1">
            <b className="block truncate text-ludo-gold">{a.title}</b>
            <small className="block text-ludo-soft">{a.body}</small>
            <small className="block text-[10px] text-ludo-soft">{timeAr(a.created_at)}</small>
          </span>
          <Button
            variant={a.active ? "royal" : "ghostGold"}
            size="sm"
            onClick={async () => {
              const r = await adminSaveAnnouncement({
                data: {
                  id: a.id,
                  title: a.title,
                  body: a.body,
                  link: a.link,
                  kind: a.kind,
                  active: !a.active,
                },
              });
              setMsg(r.ok ? "تم التحديث" : "مرفوض");
              if (r.ok) void load();
            }}
          >
            {a.active ? "ظاهر" : "مخفي"}
          </Button>
          <Button
            variant="ghostGold"
            size="sm"
            onClick={async () => {
              const r = await adminDeleteAnnouncement({ data: { id: a.id } });
              setMsg(r.ok ? "تم الحذف" : "مرفوض");
              if (r.ok) void load();
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      {items.length === 0 && <p className="text-center text-xs text-ludo-soft">لا إعلانات</p>}
      {msg && <p className="text-center text-xs text-ludo-soft">{msg}</p>}
    </div>
  );
}
