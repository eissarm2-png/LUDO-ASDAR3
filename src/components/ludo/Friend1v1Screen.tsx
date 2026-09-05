import { useCallback, useEffect, useState } from "react";
import { Loader2, Swords, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { listFriends, type FriendRow } from "@/lib/social.functions";
import { sendInvite } from "@/lib/invites.functions";
import { supabase } from "@/integrations/supabase/client";
import { PanelPage } from "./LudoApp";

export function Friend1v1Screen({
  onBack,
  onOpenRoom,
}: {
  onBack: () => void;
  onOpenRoom: (roomCode: string) => void;
}) {
  const load = useCallback(async () => {
    return listFriends();
  }, []);

  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    load().then((rows) => {
      if (active) {
        setFriends(rows.filter((r) => r.status === "accepted"));
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [load]);

  const handleChallenge = async (friendId: string) => {
    setBusy(friendId);
    try {
      // 1. إنشاء غرفة خاصة 1 ضد 1
      const { data: createData, error: createErr } = await supabase.rpc("create_room", {
        _name: "مواجهة الأصدقاء",
        _max: 2,
        _mode: "ludo",
        _public: false,
      });

      if (createErr) throw new Error(createErr.message);
      const created = (createData ?? [])[0] as { room_id: string; code: string } | undefined;
      if (!created) throw new Error("تعذّر إنشاء الغرفة");

      // 2. إرسال دعوة للصديق
      const res = await sendInvite({ data: { to: friendId, roomCode: created.code } });
      if (!res.ok) throw new Error(res.reason);

      toast.success("تم إرسال التحدي! جاري الانتقال للغرفة...");

      // 3. الدخول للغرفة بالرمز
      onOpenRoom(created.code);
    } catch (err: unknown) {
      toast.error((err as Error).message || "حدث خطأ أثناء التحدي");
    } finally {
      setBusy(null);
    }
  };

  return (
    <PanelPage title="تحدي الأصدقاء (1 ضد 1)" icon={<Swords />} onBack={onBack}>
      <div className="mb-4 rounded-xl border border-ludo-gold/30 bg-ludo-panel/70 p-4 text-center shadow-lg">
        <h3 className="text-lg font-black text-ludo-gold mb-1">المواجهة الكبرى!</h3>
        <p className="text-sm text-white/90 mb-2">تحدى أصدقاءك في مواجهة فردية ملحمية.</p>
        <p className="text-xs text-ludo-gold/80">
          رميات النرد تخصم من محفظتك والمباريات تُكسبك نقاط خبرة!
        </p>
      </div>

      <h3 className="mb-3 font-bold text-white">اختر صديقاً للتحدي:</h3>

      {loading ? (
        <div className="flex justify-center py-10 text-ludo-soft">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : friends.length === 0 ? (
        <div className="rounded-xl border border-ludo-gold/25 bg-ludo-panel/60 p-6 text-center text-sm text-ludo-soft/80">
          لا يوجد أصدقاء بعد. أضف أصدقاء من شريط الأصدقاء أولاً.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {friends.map((f) => (
            <div
              key={f.user_id}
              className="flex items-center gap-3 rounded-xl border border-ludo-gold/25 bg-ludo-panel/60 p-3"
            >
              <span className="grid size-10 place-items-center rounded-lg bg-ludo-deep/70 text-xl shadow-inner">
                {f.avatar || "👑"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-white">
                  {f.display_name}
                </span>
                <span className="block text-[11px] text-ludo-gold">صديق</span>
              </span>
              <Button
                size="sm"
                variant="royal"
                disabled={busy === f.user_id}
                onClick={() => handleChallenge(f.user_id)}
              >
                {busy === f.user_id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Swords className="size-4 ml-1" /> تحدي
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </PanelPage>
  );
}
