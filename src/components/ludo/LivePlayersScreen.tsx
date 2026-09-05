import { useEffect, useState } from "react";
import { Activity, Play, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listLivePlayers, type LivePlayerRow } from "@/lib/social.functions";
import { PanelPage } from "./LudoApp";

export function LivePlayersScreen({
  onBack,
  onSpectate,
}: {
  onBack: () => void;
  onSpectate: (roomId: string) => void;
}) {
  const [players, setPlayers] = useState<LivePlayerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listLivePlayers().then((res) => {
      if (active) {
        setPlayers(res);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <PanelPage title="المباريات المباشرة" icon={<Activity />} onBack={onBack}>
      <p className="mb-4 text-center text-sm text-ludo-soft">
        شاهد أصدقاءك واللاعبين الآخرين وهم يتنافسون الآن
      </p>

      {loading ? (
        <div className="py-12 text-center text-ludo-gold animate-pulse">
          جاري البحث عن مباريات مباشرة...
        </div>
      ) : players.length === 0 ? (
        <div className="py-8 text-center space-y-4 rounded-2xl border border-ludo-gold/30 bg-black/40 p-6">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-ludo-gold/10 text-3xl border border-ludo-gold/40">
            🎲
          </div>
          <div>
            <h4 className="text-base font-black text-white">لا توجد مباريات مباشرة نشطة الآن</h4>
            <p className="text-xs text-ludo-soft mt-1">
              كن أول من يبدأ البث والمباراة وتحدَّ أصدقاءك واللاعبين الآن!
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="play"
              size="lg"
              onClick={() => onSpectate("")}
              className="w-full text-sm font-black"
            >
              <Play className="size-4 ml-1.5" /> إنشاء أو دخول غرفة الآن 🚀
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {players.map((p) => (
            <div
              key={`${p.room_id}-${p.user_id}`}
              className="flex items-center gap-3 rounded-xl border border-ludo-gold/30 bg-ludo-panel/70 p-3 shadow-lg"
            >
              <div className="grid size-12 place-items-center rounded-full bg-[linear-gradient(180deg,#6b2160,#3a0d31)] text-2xl border border-ludo-gold/50 shadow-inner">
                {p.avatar || "👑"}
              </div>
              <div className="flex-1">
                <b className="block text-white font-bold">{p.display_name}</b>
                <span className="text-xs text-ludo-soft flex items-center gap-1 mt-1">
                  <Users className="size-3" />
                  {p.mode === "domino" ? "دومينو" : "لودو"}
                  <span className="mx-1">•</span>
                  منذ {Math.round((Date.now() - new Date(p.started_at).getTime()) / 60000)} دقيقة
                </span>
              </div>
              <Button
                size="sm"
                variant="royal"
                onClick={() => onSpectate(p.room_id)}
                className="text-xs font-bold shrink-0"
              >
                <Play className="size-3.5 ml-1" /> انضم / شاهد
              </Button>
            </div>
          ))}
        </div>
      )}
    </PanelPage>
  );
}
