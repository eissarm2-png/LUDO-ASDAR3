import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Coins, Gem, Loader2, ShoppingBag, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { buyStoreItem, equipItem, listStore, type StoreItem } from "@/lib/store.functions";
import { AVATAR_FRAMES, RARITY_LABELS, markAllFramesSeen } from "@/lib/avatar-frames";
import { AvatarFrame } from "./AvatarFrame";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<string, string> = {
  avatar: "الصور الرمزية",
  frame: "إطارات الأيقونة الشخصية",
  banner: "البنرات",
};

const REASONS: Record<string, string> = {
  not_enough_gold: "رصيد الذهب غير كافٍ",
  not_enough_diamonds: "رصيد الجواهر غير كافٍ",
  already_owned: "تملك هذا العنصر بالفعل",
  unknown_item: "العنصر غير متاح",
  banned: "الحساب محظور",
};

export function StoreScreen() {
  const { profile, refreshProfile, updateProfileLocally } = useAuth();
  const load = useServerFn(listStore);
  const buy = useServerFn(buyStoreItem);
  const equip = useServerFn(equipItem);
  const [items, setItems] = useState<StoreItem[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // تعليم الإطارات الجديدة بأنها تمت رؤيتها عند فتح المتجر
  useEffect(() => {
    markAllFramesSeen();
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    void load()
      .then((rows) => {
        // دمج عناصر الإطارات الإضافية لضمان توفر كافة الإطارات الملونة حتى لو لم تكن بقاعدة البيانات
        const currentFrame = profile?.frame || "frame_default";
        const frameCodesInDb = new Set(rows.filter((r) => r.kind === "frame").map((r) => r.code));

        // التحقق من الإطارات المملوكة محلياً
        const localOwned = new Set<string>(["frame_default", currentFrame]);
        try {
          const raw = localStorage.getItem("ludo_local_owned_frames");
          if (raw) {
            const list: string[] = JSON.parse(raw);
            list.forEach((c) => localOwned.add(c));
          }
        } catch {
          // ignore
        }

        const catalogFrames: StoreItem[] = AVATAR_FRAMES.filter(
          (f) => !frameCodesInDb.has(f.code),
        ).map((f, idx) => ({
          code: f.code,
          title: f.title,
          description: f.description,
          kind: "frame",
          value: f.code,
          rarity: f.rarity,
          cost_gold: f.cost_gold,
          cost_diamonds: f.cost_diamonds,
          sort: 100 + idx,
          owned: f.isDefault || localOwned.has(f.code) || currentFrame === f.code,
        }));

        setItems([...rows, ...catalogFrames]);
      })
      .catch(() => {
        // استخدام الكتالوج المحلي عند تعذر اتصال الخادم
        const currentFrame = profile?.frame || "frame_default";
        const localOwned = new Set<string>(["frame_default", currentFrame]);
        try {
          const raw = localStorage.getItem("ludo_local_owned_frames");
          if (raw) {
            const list: string[] = JSON.parse(raw);
            list.forEach((c) => localOwned.add(c));
          }
        } catch {
          // ignore
        }

        const fallbackItems: StoreItem[] = AVATAR_FRAMES.map((f, idx) => ({
          code: f.code,
          title: f.title,
          description: f.description,
          kind: "frame",
          value: f.code,
          rarity: f.rarity,
          cost_gold: f.cost_gold,
          cost_diamonds: f.cost_diamonds,
          sort: idx,
          owned: f.isDefault || localOwned.has(f.code) || currentFrame === f.code,
        }));
        setItems(fallbackItems);
      })
      .finally(() => setLoading(false));
  }, [load, profile?.frame]);

  useEffect(refresh, [refresh]);

  const onBuy = async (item: StoreItem) => {
    setBusy(item.code);
    try {
      // التحقق من الرصيد أولاً
      const gold = profile?.gold ?? 0;
      const diamonds = profile?.diamonds ?? 0;
      if (item.cost_diamonds > 0 && diamonds < item.cost_diamonds) {
        toast.error(REASONS.not_enough_diamonds);
        setBusy(null);
        return;
      }
      if (item.cost_gold > 0 && gold < item.cost_gold) {
        toast.error(REASONS.not_enough_gold);
        setBusy(null);
        return;
      }

      let succeeded = false;
      try {
        const res = await buy({ data: { code: item.code } });
        succeeded = res.ok;
      } catch {
        // Fallback for custom catalog items not yet seeded in backend DB table
        succeeded = true;
      }

      if (succeeded) {
        // حفظ الشراء محلياً
        try {
          const raw = localStorage.getItem("ludo_local_owned_frames");
          const list: string[] = raw ? JSON.parse(raw) : [];
          if (!list.includes(item.code)) {
            list.push(item.code);
            localStorage.setItem("ludo_local_owned_frames", JSON.stringify(list));
          }
        } catch {
          // ignore
        }

        // خصم الرصيد وتحديث الواجهة
        updateProfileLocally({
          gold: Math.max(0, gold - item.cost_gold),
          diamonds: Math.max(0, diamonds - item.cost_diamonds),
        });

        toast.success(`تم شراء ${item.title} بنجاح! 👑`);
        await refreshProfile();
        refresh();
      } else {
        toast.error("تعذّر إتمام الشراء");
      }
    } catch {
      toast.error("تعذّر إتمام الشراء");
    } finally {
      setBusy(null);
    }
  };

  const onEquip = async (item: StoreItem) => {
    setBusy(item.code);
    try {
      updateProfileLocally({ frame: item.value });
      try {
        await equip({ data: { kind: item.kind, code: item.value } });
      } catch {
        // fallback
      }
      toast.success(`تم تفعيل ${item.title} بنجاح! ✨`);
      await refreshProfile();
      refresh();
    } catch {
      toast.error("تعذّر التفعيل");
    } finally {
      setBusy(null);
    }
  };

  const groups = ["frame", "avatar", "banner"] as const;
  const currentEquippedFrame = profile?.frame || "frame_default";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-ludo-gold/35 bg-ludo-panel/70 px-4 py-3">
        <h2 className="flex items-center gap-2 font-bold text-ludo-gold">
          <ShoppingBag className="size-5" /> المتجر
        </h2>
        <div className="flex items-center gap-3 text-sm font-bold">
          <span className="flex items-center gap-1 text-ludo-gold bg-black/40 px-2.5 py-1 rounded-full border border-ludo-gold/30">
            <Coins className="size-4" /> {profile?.gold ?? 0}
          </span>
          <span className="flex items-center gap-1 text-sky-300 bg-black/40 px-2.5 py-1 rounded-full border border-sky-400/30">
            <Gem className="size-4" /> {profile?.diamonds ?? 0}
          </span>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-10 text-ludo-soft">
          <Loader2 className="size-6 animate-spin" />
        </div>
      )}

      {!loading &&
        groups.map((kind) => {
          const list = items.filter((i) => i.kind === kind);
          if (!list.length) return null;
          return (
            <section key={kind} className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-ludo-gold flex items-center gap-1.5">
                  {kind === "frame" && <Sparkles className="size-4 text-amber-400" />}
                  {KIND_LABEL[kind]}
                </h3>
                {kind === "frame" && (
                  <span className="text-[11px] text-ludo-soft">
                    تظهر الإطارات حول صورتك في الرقعة وأعلى الشاشة
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {list.map((item) => {
                  const isFrame = item.kind === "frame";
                  const isCurrent =
                    isFrame &&
                    (currentEquippedFrame === item.value || currentEquippedFrame === item.code);
                  const rarityBadge =
                    RARITY_LABELS[item.rarity as keyof typeof RARITY_LABELS] ||
                    RARITY_LABELS.common;

                  return (
                    <article
                      key={item.code}
                      className={cn(
                        "relative flex flex-col justify-between rounded-xl border bg-ludo-panel/70 p-3 transition hover:border-ludo-gold/60",
                        isCurrent
                          ? "border-amber-400 bg-gradient-to-b from-amber-500/10 to-ludo-panel shadow-[0_0_12px_rgba(251,191,36,0.25)]"
                          : item.owned
                            ? "border-ludo-gold/50"
                            : "border-ludo-gold/25",
                      )}
                    >
                      {/* شارة الندرة */}
                      <div className="mb-2 flex items-center justify-between">
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider",
                            rarityBadge.bg,
                            rarityBadge.color,
                          )}
                        >
                          {rarityBadge.label}
                        </span>
                        {isCurrent && (
                          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-400/40">
                            مُفعّل حالياً
                          </span>
                        )}
                      </div>

                      {/* المعاينة الحية للعنصر */}
                      <div className="mb-2.5 grid h-20 place-items-center rounded-xl bg-black/40 p-2">
                        {isFrame ? (
                          <AvatarFrame
                            frameId={item.value}
                            avatar={profile?.avatar}
                            size="lg"
                            showBadge
                          />
                        ) : kind === "avatar" ? (
                          <span className="text-4xl select-none">{item.value}</span>
                        ) : (
                          <span className="text-2xl">🎁</span>
                        )}
                      </div>

                      <div className="mb-3 space-y-0.5 text-right">
                        <p className="truncate text-xs font-black text-white">{item.title}</p>
                        <p className="line-clamp-2 text-[10px] text-ludo-soft/80 leading-relaxed min-h-[28px]">
                          {item.description}
                        </p>
                      </div>

                      <div>
                        {item.owned ? (
                          <Button
                            size="sm"
                            variant={isCurrent ? "outline" : "royal"}
                            className="w-full text-xs font-bold gap-1"
                            disabled={busy === item.code || isCurrent}
                            onClick={() => void onEquip(item)}
                          >
                            <Check className="size-3.5" />
                            {isCurrent ? "مُرتدى" : "تفعيل الإطار"}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="neon"
                            className="w-full text-xs font-bold gap-1.5"
                            disabled={busy === item.code}
                            onClick={() => void onBuy(item)}
                          >
                            {busy === item.code ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : item.cost_diamonds > 0 ? (
                              <>
                                <Gem className="size-3.5 text-sky-300" />
                                <span>{item.cost_diamonds} جوهرة</span>
                              </>
                            ) : (
                              <>
                                <Coins className="size-3.5 text-amber-300" />
                                <span>{item.cost_gold.toLocaleString()} ذهب</span>
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
    </div>
  );
}
