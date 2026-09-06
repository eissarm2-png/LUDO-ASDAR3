import { toast } from "sonner";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BookOpen,
  Bot,
  ChevronLeft,
  Crown,
  Coins,
  Eye,
  Gem,
  Gift,
  History,
  Layers,
  Target,
  Home,
  ListOrdered,
  Medal,
  Menu,
  MessageSquare,
  Plus,
  RotateCcw,
  Settings,
  Smile,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trophy,
  UserCircle2,
  Users,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import homeUi from "@/assets/home-ui.jpeg.asset.json";

import coinStack from "@/assets/coin-stack.png";
import gemEmerald from "@/assets/gem-emerald.png";
import giftBox from "@/assets/gift-box.png";
import chestClosed from "@/assets/chest-closed.png";
import diceRoyal from "@/assets/dice-royal.png";
import avatarTiger from "@/assets/avatar-tiger.png";
import mode2p from "@/assets/mode-2p.png";
import mode4p from "@/assets/mode-4p.png";
import modeDomino from "@/assets/mode-domino.png";
import modeMissions from "@/assets/mode-missions.png";
import modeLedger from "@/assets/mode-ledger.png";
import chestOpen from "@/assets/chest-open.png";
import modeRules from "@/assets/mode-rules.png";
import navHome from "@/assets/nav-home.png";
import navStore from "@/assets/nav-store.png";
import navFriends from "@/assets/nav-friends.png";
import navTrophy from "@/assets/nav-trophy.png";
import navSettings from "@/assets/nav-settings.png";
import { Dice } from "./Dice";
import { LudoBoard } from "./LudoBoard";
import { RulesContent } from "./RulesScreen";
import { Leaderboard } from "./LeaderboardScreen";
import { AuthPanel } from "./AuthScreen";
import { AdminPanel } from "./AdminScreen";
import { SettingsPanel } from "./SettingsScreen";
import { MatchHistory } from "./HistoryScreen";
import { MissionsPanel } from "./MissionsScreen";
import { ChestsPanel } from "./ChestsScreen";
import { LedgerPanel } from "./LedgerScreen";
import { OpenedChestsPanel } from "./OpenedChestsScreen";
import { DominoGame } from "@/components/domino/DominoGame";
import { SplashScreen } from "./SplashScreen";
import { GateScreen } from "./GateScreen";
import { RoomsPanel, type RoomLaunch } from "./RoomsScreen";
import { AvatarFrame } from "./AvatarFrame";
import { useFrameStore } from "@/hooks/useFrameStore";
import { supabase } from "@/integrations/supabase/client";
import { MatchSummary, type MatchEvent } from "./MatchSummary";
import { haptics, loadHaptics, setHaptics as persistHaptics } from "@/lib/haptics";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import {
  initAudio,
  loadMuted,
  loadVolume,
  setMuted as persistMuted,
  setVolume as persistVolume,
  sfx,
} from "@/lib/audio";
import {
  applyAnimations,
  applyGameplay,
  DEFAULT_GAMEPLAY,
  loadAnimations,
  loadGameplay,
  saveGameplay,
  setAnimations as persistAnimations,
  type GameplayPrefs,
} from "@/lib/prefs";
import { StoreScreen } from "./StoreScreen";
import { FriendsScreen } from "./FriendsScreen";
import { AchievementsScreen } from "./AchievementsScreen";
import { DiceSkinScreen } from "./DiceSkinScreen";
import { SeasonScreen } from "./SeasonScreen";
import { SupportScreen } from "./SupportScreen";
import { InvitesScreen } from "./InvitesScreen";
import { ProfileScreen } from "./ProfileScreen";
import { RewardsScreen } from "./RewardsScreen";
import { TournamentsScreen } from "./TournamentsScreen";
import { ApkManagerSection } from "./ApkManagerSection";
import { LivePlayersScreen } from "./LivePlayersScreen";
import { Friend1v1Screen } from "./Friend1v1Screen";
import { WalletScreen } from "./WalletScreen";
import { SecurityScreen } from "./SecurityScreen";
import { ReconnectOverlay } from "./ReconnectOverlay";
import { MatchmakingScreen } from "./MatchmakingScreen";
import { ExitConfirm } from "./ExitConfirm";
import { AccountLinkCard } from "./AccountLinkCard";
import { useUnreadNotifications } from "@/hooks/useLiveCounts";
import { NotificationsScreen } from "./NotificationsScreen";
import { SmartPopups, triggerSmartWinPopup } from "./SmartPopups";
import { DailyRewardModal } from "./DailyRewardModal";
import { AnimatedRoyalDice } from "./AnimatedRoyalDice";
import { getDailyRewardState } from "@/lib/daily-reward";
import { useServerFn } from "@tanstack/react-start";
import { submitMatchResult } from "@/lib/match.functions";
import { chargeDiceRoll } from "@/lib/wallet.functions";
import { AnnouncementBar } from "./AnnouncementBar";
import { enqueueResult, flushQueue, isOnline, onReconnect } from "@/lib/offline-queue";
import {
  forfeitServerTurn,
  reconcileServerState,
  rollServerDie,
  startServerTurn,
} from "@/lib/live.functions";
import { TurnTimer } from "./TurnTimer";
import { MatchChat, type ChatContext, type ChatMessage } from "./MatchChat";
import { PlayerChatBubble, type ChatBubbleData } from "./PlayerChatBubble";
import { LiveVoiceButton } from "./LiveVoice";
import {
  recordTournamentMatchOutcome,
  getRoundName,
  type TournamentRound,
} from "@/lib/tournament-manager";
import {
  saveActiveMatch,
  loadActiveMatch,
  clearActiveMatch,
  saveUserLocalProgress,
  type SavedMatchState,
} from "@/lib/user-progress";
import {
  applyMove,
  applyRoll,
  createGame,
  currentPlayer,
  forfeitTurn,
  legalMoves,
  pickBotMove,
  rollDie,
  tokensDone,
  type GameState,
} from "@/lib/ludo/engine";
import { SEATS } from "@/lib/ludo/board";
import { cn } from "@/lib/utils";

const TURN_SECONDS = 15;
/** رسوم رمية النرد بالذهب — تُخصم من المحفظة في كل رمية */
const ROLL_COST = 2;

type Screen =
  | "home"
  | "friend1v1"
  | "live"
  | "setup"
  | "rooms"
  | "rewards"
  | "tournaments"
  | "rules"
  | "leaderboard"
  | "account"
  | "history"
  | "settings"
  | "missions"
  | "chests"
  | "ledger"
  | "opened"
  | "store"
  | "friends"
  | "achievements"
  | "dice"
  | "season"
  | "support"
  | "invites"
  | "matchmaking"
  | "profile"
  | "wallet"
  | "security"
  | "notifications"
  | "domino"
  | "admin"
  | "apk"
  | "game";

const colorBg: Record<string, string> = {
  ruby: "bg-ludo-ruby",
  palm: "bg-ludo-palm",
  amber: "bg-ludo-amber",
  lagoon: "bg-ludo-lagoon",
};

export function LudoApp() {
  return (
    <AuthProvider>
      <LudoShell />
    </AuthProvider>
  );
}

type RollBroadcastPayload = {
  seat?: number;
  turn?: number;
  startedAt?: number;
  duration?: number;
};

type StateBroadcastPayload = {
  v: number;
  state: GameState;
  rollCompleted?: boolean;
  diceValue?: number;
  serverTimestamp?: number;
};

type SyncRequestPayload = {
  fromVersion: number;
  requesterSeat?: number;
};

type SyncResponsePayload = {
  v: number;
  state: GameState;
  responderSeat?: number;
};

function LudoShell() {
  const { user, profile, isAdmin, refreshProfile } = useAuth();
  const [screen, setScreen] = useState<Screen>("home");
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(4);
  const [humanCount, setHumanCount] = useState(1);
  const [game, setGame] = useState<GameState>(() => createGame(4, 1));
  const [rolling, setRolling] = useState(false);
  const [muted, setMuted] = useState(false);
  const [haptic, setHaptic] = useState(true);
  const [stage, setStage] = useState<"splash" | "gate" | "app">("splash");

  // تجاوز شاشة الترحيب بسلاسة بعد نجاح الـ Hydration إذا تم إكمالها مسبقاً في الجلسة
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.sessionStorage?.getItem("abqor_splash_done") === "1"
    ) {
      setStage(guestReady() || user ? "app" : "gate");
    }
  }, [user]);

  const [dailyRewardOpen, setDailyRewardOpen] = useState(false);
  const [dailyAvailable, setDailyAvailable] = useState(false);
  const [autoDailyTriggered, setAutoDailyTriggered] = useState(false);

  // مراقبة توفر المكافأة اليومية والتحديث عند الاستلام
  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateDailyStatus = () => {
      const state = getDailyRewardState(user?.id);
      setDailyAvailable(!state.hasClaimedToday);
    };
    updateDailyStatus();
    window.addEventListener("daily_reward_claimed", updateDailyStatus);
    return () => window.removeEventListener("daily_reward_claimed", updateDailyStatus);
  }, [user?.id]);

  // إظهار نافذة المكافأة اليومية تلقائياً عند فتح التطبيق ودخول الشاشة الرئيسية
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (stage !== "app" || screen !== "home" || game.phase !== "idle") return;

    const alreadyShown = window.sessionStorage?.getItem("abqor_daily_modal_shown") === "1";
    const state = getDailyRewardState(user?.id);

    if (!state.hasClaimedToday && !alreadyShown) {
      const timer = setTimeout(() => {
        setAutoDailyTriggered(true);
        setDailyRewardOpen(true);
        window.sessionStorage?.setItem("abqor_daily_modal_shown", "1");
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [stage, screen, game.phase, user?.id]);

  const [guest, setGuest] = useState(false);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [volume, setVolume] = useState(0.6);
  const [animations, setAnimations] = useState(true);
  const [gameplay, setGameplay] = useState<GameplayPrefs>(DEFAULT_GAMEPLAY);
  const [exitAsk, setExitAsk] = useState(false);
  const [roomsKey, setRoomsKey] = useState(0);
  const { count: unreadCount } = useUnreadNotifications();
  const [celebrate, setCelebrate] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(TURN_SECONDS);
  const [serverSynced, setServerSynced] = useState(false);
  const [inRoom, setInRoom] = useState(false);
  /** فقاعات المحادثة النشطة المعروضة فوق رؤوس اللاعبين */
  const [chatBubbles, setChatBubbles] = useState<Record<number, ChatBubbleData>>({});
  /** آخر رسالة محادثة واردة ليتم دمجها في نافذة المحادثة */
  const [incomingChatMessage, setIncomingChatMessage] = useState<ChatMessage | null>(null);
  /** فهرس مقعدي داخل players في مباراة الغرفة (0 في اللعب الفردي) */
  const [seatIndex, setSeatIndex] = useState(0);
  const [activeTournament, setActiveTournament] = useState<{
    id: string;
    name: string;
    icon: string;
    round: TournamentRound;
    roundNumber: number;
    prizeGold: number;
    prizeDiamonds: number;
  } | null>(null);
  const [savedMatch, setSavedMatch] = useState<SavedMatchState | null>(() => {
    if (typeof window === "undefined") return null;
    return loadActiveMatch();
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSavedMatch(loadActiveMatch());
    }
  }, [screen]);

  // استئناف المباراة المحفوظة
  const handleResumeSavedMatch = useCallback(() => {
    if (!savedMatch) return;
    setGame(savedMatch.game);
    setPlayerCount(savedMatch.playerCount);
    setSeatIndex(savedMatch.seatIndex);
    if (savedMatch.tournamentInfo) {
      setActiveTournament(savedMatch.tournamentInfo as any);
    }
    setSavedMatch(null);
    setScreen("game");
    toast.success("تم استئناف المباراة بنجاح! 🎲");
  }, [savedMatch]);

  // تخطي وإلغاء المباراة المحفوظة
  const handleDismissSavedMatch = useCallback(() => {
    clearActiveMatch();
    setSavedMatch(null);
    toast.info("تم إلغاء وحذف المباراة السابقة");
  }, []);

  // منع إعادة تحميل الصفحة العرضية وفقدان المباراة أثناء اللعب
  useEffect(() => {
    if (screen !== "game" || game.phase === "over") return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "لديك مباراة جارية! هل أنت متأكد من مغادرة اللعبة؟ سيتم حفظ تقدمك تلقائياً.";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [screen, game.phase]);

  // حفظ تقدم المباراة الحالية تلقائياً لاستئنافها عند الحاجة
  useEffect(() => {
    if (screen === "game" && game.phase !== "over" && game.players.length > 0) {
      saveActiveMatch({
        id: matchId.current || "solo_match",
        savedAt: Date.now(),
        mode: "ludo",
        playerCount,
        seatIndex,
        tournamentInfo: activeTournament ?? undefined,
        game,
      });
    }
  }, [screen, game, playerCount, seatIndex, activeTournament]);

  const stateVersion = useRef(0);
  const localActed = useRef(false);
  const matchChannel = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const savedFor = useRef<string | null>(null);
  const matchId = useRef<string>("");
  const matchStart = useRef<number>(0);
  const moveCount = useRef(0);
  const rollSeq = useRef(0);
  const clockOffset = useRef(0);
  const warned = useRef(0);
  const turnSig = useRef<string | null>(null);
  const rollingRef = useRef(false);
  const gameRef = useRef(game);
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  // إعادة تعيين مؤشرات الرمي تلقائيًا عند انتقال الدور لمنع تعليق النرد أبدًا
  useEffect(() => {
    rollingRef.current = false;
    setRolling(false);
  }, [game.turn]);

  // صمام أمان: فك تعليق دوران النرد تلقائيًا بعد 1.6 ثانية كحد أقصى مهما حدث
  useEffect(() => {
    if (!rolling) return;
    const timeout = window.setTimeout(() => {
      rollingRef.current = false;
      setRolling(false);
    }, 1600);
    return () => window.clearTimeout(timeout);
  }, [rolling]);
  const remoteRollStartedAt = useRef<number | null>(null);
  const remoteRollDuration = useRef<number>(650);
  const remoteRollTimer = useRef<number | null>(null);
  const sendResult = useServerFn(submitMatchResult);
  const payRoll = useServerFn(chargeDiceRoll);

  // تفريغ طابور النتائج المؤجّلة عند تسجيل الدخول أو عودة الاتصال
  useEffect(() => {
    if (!user) return;
    const flush = () => {
      void flushQueue((data) => sendResult({ data })).then((n) => {
        if (n > 0) {
          toast.success(`تمت مزامنة ${n} نتيجة محفوظة دون اتصال`);
          void refreshProfile();
        }
      });
    };
    flush();
    return onReconnect(flush);
  }, [user, sendResult, refreshProfile]);
  const sendRoll = useServerFn(rollServerDie);
  const openTurn = useServerFn(startServerTurn);
  const endTurn = useServerFn(forfeitServerTurn);
  const reconcileState = useServerFn(reconcileServerState);

  useEffect(() => {
    setMuted(loadMuted());
    setVolume(loadVolume());
    setHaptic(loadHaptics());
    const anim = loadAnimations();
    setAnimations(anim);
    applyAnimations(anim);
    const gp = loadGameplay();
    setGameplay(gp);
    applyGameplay(gp);
    setPlayerCount(gp.players);
  }, []);

  const changeVolume = (next: number) => {
    setVolume(next);
    persistVolume(next);
  };

  const changeHaptics = (next: boolean) => {
    setHaptic(next);
    persistHaptics(next);
    if (next) haptics.tap();
  };

  const changeGameplay = (next: GameplayPrefs) => {
    setGameplay(next);
    saveGameplay(next);
    if (!inRoom) setPlayerCount(next.players);
  };

  const changeAnimations = (next: boolean) => {
    setAnimations(next);
    persistAnimations(next);
  };

  const showCelebration = useCallback(
    (ms: number) => {
      if (!animations) return;
      setCelebrate(true);
      window.setTimeout(() => setCelebrate(false), ms);
    },
    [animations],
  );

  const toggleMute = (value?: boolean) => {
    setMuted((prev) => {
      const next = value ?? !prev;
      persistMuted(next);
      if (!next) sfx.tap();
      return next;
    });
  };

  const moves = useMemo(
    () => (game.phase === "move" && game.dice ? legalMoves(game, game.dice) : []),
    [game],
  );
  const player = currentPlayer(game);
  /** في الغرف: يتحكم كل لاعب بدوره فقط، أما محليًا فالجهاز يتحكم بكل الأدوار البشرية */
  const isMyTurn = !inRoom || game.turn === seatIndex;

  const navigate = useCallback((next: Screen) => {
    initAudio();
    sfx.tap();
    haptics.tap();
    setScreen(next);
  }, []);

  const startGame = () => {
    initAudio();
    setInRoom(false);
    setSeatIndex(0);
    setGame(createGame(playerCount, Math.min(humanCount, playerCount)));
    savedFor.current = null;
    matchId.current = crypto.randomUUID();
    matchStart.current = Date.now();
    moveCount.current = 0;
    setEvents([]);
    sfx.start();
    setScreen("game");
    showCelebration(1600);
  };

  /** لعب فردي فوري: يبدأ تلقائيًا بدون غرفة ولا انتظار، أنا + روبوتات */
  const startSolo = useCallback(
    (players: number) => {
      initAudio();
      setInRoom(false);
      setSeatIndex(0);
      const safePlayers = Math.min(4, Math.max(2, players)) as 2 | 3 | 4;
      setPlayerCount(safePlayers);
      setHumanCount(1);
      setGame(createGame(safePlayers, 1));
      savedFor.current = null;
      matchId.current = crypto.randomUUID();
      matchStart.current = Date.now();
      moveCount.current = 0;
      setEvents([]);
      sfx.start();
      setScreen("game");
      showCelebration(1600);
      toast.success("بدأ اللعب أوفلاين (مجانًا)");
    },
    [showCelebration],
  );

  const startDomino = () => {
    initAudio();
    setInRoom(false);
    matchId.current = crypto.randomUUID();
    matchStart.current = Date.now();
    savedFor.current = null;
    sfx.start();
    setScreen("domino");
  };

  /** بدء مباراة غرفة حقيقية بمعرّف مباراة موحّد لكل الأعضاء */
  const launchRoomMatch = useCallback(
    (launch: RoomLaunch) => {
      try {
        initAudio();
        const names =
          Array.isArray(launch?.names) && launch.names.length > 0
            ? launch.names
            : ["لاعب 1", "لاعب 2"];
        const count = Math.min(4, Math.max(2, names.length)) as 2 | 3 | 4;
        setInRoom(true);
        setSeatIndex(Math.min(Math.max(0, launch?.seatIndex ?? 0), count - 1));
        stateVersion.current = 0;
        localActed.current = false;
        setPlayerCount(count);
        setHumanCount(count);
        savedFor.current = null;
        matchId.current = launch?.matchId || crypto.randomUUID();
        matchStart.current = Date.now();
        moveCount.current = 0;
        setEvents([]);
        sfx.start();
        if (launch?.mode === "domino") {
          setScreen("domino");
          return;
        }
        setGame(createGame(count, count, names.slice(0, count)));
        setScreen("game");
        showCelebration(1600);
      } catch (err) {
        console.error("Failed to launch room match:", err);
        toast.error("تعذّر بدء المباراة داخل الغرفة، يرجى المحاولة ثانية");
      }
    },
    [showCelebration],
  );

  /** الخروج النهائي من المباراة: يغادر الغرفة فعليًا ولا يُعيدني إليها تلقائيًا */
  const exitMatch = useCallback(() => {
    const id = matchId.current;
    if (inRoom) {
      try {
        const raw = localStorage.getItem("abqor:left-matches");
        const list: string[] = raw ? JSON.parse(raw) : [];
        localStorage.setItem("abqor:left-matches", JSON.stringify([...list.slice(-19), id]));
      } catch {
        /* التخزين المحلي قد يكون معطّلًا */
      }
      void (async () => {
        const { data } = await supabase.rpc("my_active_room");
        const active = (data ?? [])[0] as { room_id: string } | undefined;
        if (active?.room_id) await supabase.rpc("leave_room", { _room: active.room_id });
      })();
    }
    setInRoom(false);
    setSeatIndex(0);
    setDeadline(null);
    setRolling(false);
    rollingRef.current = false;
    if (remoteRollTimer.current) {
      window.clearTimeout(remoteRollTimer.current);
      remoteRollTimer.current = null;
    }
    remoteRollStartedAt.current = null;
    navigate("home");
  }, [inRoom, navigate]);

  const reportMatch = useCallback(
    (payload: {
      result: "win" | "loss";
      players: number;
      moves: number;
      mode: "ludo" | "domino";
    }) => {
      const key = `${matchId.current}-${payload.result}-${payload.mode}`;
      if (!user || !matchId.current || savedFor.current === key) return;
      savedFor.current = key;
      const entry = {
        matchId: matchId.current,
        result: payload.result,
        players: payload.players,
        moves: payload.moves,
        durationMs: Math.max(0, Date.now() - matchStart.current),
        mode: payload.mode,
      };

      // بدون اتصال: تُحفظ النتيجة والنقاط محليًا وتُرسل تلقائيًا عند عودة الشبكة
      if (!isOnline()) {
        enqueueResult(entry);
        return;
      }

      void sendResult({ data: entry })
        .then((res) => {
          // مكافأة الفوز الحقيقية تظهر فورًا في المحفظة والنقاط
          if (res?.ok && !res.duplicate && payload.result === "win") {
            toast.success(`فوز! +${res.gold} ذهب • +${res.points} نقطة • +${res.xp} خبرة`);
          }
          return refreshProfile();
        })
        .catch(() => {
          enqueueResult(entry);
        });
    },
    [user, sendResult, refreshProfile],
  );

  /** لا ننتظر السيرفر أكثر من ثانيتين حتى لا يتجمّد النرد */
  const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T | null> =>
    Promise.race([
      promise.catch(() => null),
      new Promise<null>((resolve) => window.setTimeout(() => resolve(null), ms)),
    ]);

  // ===== المرحلة 9: رمية موثّقة من السيرفر + خصم من المحفظة مع تزامن لحظي فوري =====
  const handleRoll = async () => {
    if (rollingRef.current || rolling) return;
    if (game.phase !== "roll") {
      if (isMyTurn) toast.info("عليك تحريك إحدى قطعك الآن!");
      return;
    }
    if (!isMyTurn) {
      toast.info("انتظر دورك — الآن دور " + player.name);
      return;
    }
    initAudio();

    // تشغيل دوران النرد فورًا على شاشة اللاعب
    rollingRef.current = true;
    setRolling(true);
    sfx.diceRoll();
    haptics.diceRoll();

    const rollStartTime = Date.now();
    const serverTimestamp = rollStartTime + clockOffset.current;
    const minRollDuration = 550; // مدة دوران النرد الموحدة لجميع اللاعبين

    // بث حالة 'rolling' بدقة لجميع اللاعبين عبر matchChannel لحظة الضغط مع بيانات التوقيت
    if (inRoom && matchChannel.current) {
      try {
        void matchChannel.current.send({
          type: "broadcast",
          event: "rolling",
          payload: {
            seat: player.seat,
            turn: game.turn,
            startedAt: serverTimestamp,
            duration: minRollDuration,
          },
        });
      } catch (err) {
        console.warn("فشل بث حالة دوران النرد للغرفة:", err);
      }
    }

    const seq = (rollSeq.current += 1);

    // دوران النرد بالتوازي مع استدعاء السيرفر لامتصاص تأخير الشبكة
    const spinPromise = new Promise((resolve) => window.setTimeout(resolve, minRollDuration));

    // تشغيل خصم الرسوم اختياريًا في الخلفية دون أي تعطيل أو اشتراط
    if (inRoom && user && isOnline() && (profile?.gold ?? 0) >= ROLL_COST) {
      void payRoll({ data: { cost: ROLL_COST, matchId: matchId.current } }).catch(() => {});
    }

    let value = 0;
    let trusted = false;

    try {
      const [res] = await Promise.all([
        inRoom
          ? withTimeout(sendRoll({ data: { matchId: matchId.current, seq } }), 450)
          : Promise.resolve(null),
        spinPromise,
      ]);
      value = res?.value ?? rollDie();
      trusted = Boolean(res?.sig);
    } catch {
      await spinPromise;
      value = rollDie();
      trusted = false;
    }

    // حساب الوقت المنقضي لضمان اكتمال حركة النرد بشكل سلس
    const elapsed = Date.now() - rollStartTime;
    if (elapsed < minRollDuration) {
      await new Promise((resolve) => window.setTimeout(resolve, minRollDuration - elapsed));
    }

    setVerified(trusted);
    localActed.current = false;
    const nextGame = applyRoll(game, value);

    // بث الحالة فورًا مع مؤشر انتهاء الرمي وقيمة النرد لضبط تزامن الأجهزة فورًا
    if (inRoom && matchChannel.current) {
      stateVersion.current += 1;
      void matchChannel.current.send({
        type: "broadcast",
        event: "state",
        payload: {
          v: stateVersion.current,
          state: nextGame,
          rollCompleted: true,
          diceValue: value,
          serverTimestamp: Date.now() + clockOffset.current,
        },
      });
    }

    setGame(nextGame);
    if (nextGame.turn !== game.turn) {
      window.setTimeout(() => {
        sfx.turnPass();
        haptics.turnPass();
      }, 180);
    }

    sfx.diceLand(value);
    haptics.diceLand();
    rollingRef.current = false;
    setRolling(false);
  };

  const commitMove = useCallback(
    (state: GameState, move: ReturnType<typeof legalMoves>[number]) => {
      moveCount.current += 1;
      const seat = currentPlayer(state).seat;
      const kind: MatchEvent["kind"] = move.captures.length
        ? "capture"
        : move.finishes
          ? "home"
          : move.entersBoard
            ? "enter"
            : "move";

      // الصوت والاهتزاز مضبوطان على توقيت انتقال القطعة (300ms)
      if (kind === "capture") {
        sfx.move();
        window.setTimeout(() => {
          sfx.capture();
          haptics.capture();
        }, 300);
      } else if (kind === "home") {
        sfx.move();
        window.setTimeout(() => {
          sfx.home();
          haptics.home();
        }, 300);
      } else if (kind === "enter") {
        sfx.enter();
        haptics.enter();
      } else {
        sfx.move();
        haptics.move();
      }

      setEvents((prev) => [
        ...prev.slice(-40),
        {
          kind,
          seat,
          seatLabel: currentPlayer(state).name,
          from: move.from,
          to: move.to,
          die: state.dice ?? 0,
          at: Date.now(),
        },
      ]);

      const next = applyMove(state, move);
      if (next.turn !== state.turn && next.phase !== "over") {
        window.setTimeout(() => {
          sfx.turnPass();
          haptics.turnPass();
        }, 420);
      }
      return next;
    },
    [],
  );

  const handleToken = (id: string) => {
    if (!isMyTurn) {
      toast.info("انتظر دورك — الآن دور " + player.name);
      return;
    }
    const move = moves.find((item) => item.tokenId === id);
    if (move) {
      localActed.current = true;
      setGame((g) => commitMove(g, move));
    } else {
      toast.info(game.phase === "roll" ? "يجب رمي النرد أولاً!" : "لا يمكنك تحريك هذه القطعة");
    }
  };

  // نوبة الروبوت
  useEffect(() => {
    if (screen !== "game" || game.phase === "over" || !player.isBot || rolling) return;
    const timer = window.setTimeout(() => {
      if (game.phase === "roll") {
        rollingRef.current = true;
        setRolling(true);
        sfx.diceRoll();
        const botRollStart = Date.now() + clockOffset.current;
        if (inRoom && matchChannel.current) {
          void matchChannel.current.send({
            type: "broadcast",
            event: "rolling",
            payload: {
              seat: player.seat,
              turn: game.turn,
              startedAt: botRollStart,
              duration: 600,
            },
          });
        }
        window.setTimeout(() => {
          const value = rollDie();
          localActed.current = true;
          setGame((g) => applyRoll(g, value));
          sfx.diceLand(value);
          haptics.diceLand();
          rollingRef.current = false;
          setRolling(false);
        }, 560);
      } else if (moves.length) {
        setGame((g) => commitMove(g, pickBotMove(moves)));
      }
    }, 720);
    return () => window.clearTimeout(timer);
  }, [
    screen,
    game.phase,
    game.turn,
    game.dice,
    game.winner,
    player.isBot,
    rolling,
    moves,
    commitMove,
  ]);

  // حركة وحيدة تُنفّذ تلقائيًا
  useEffect(() => {
    if (game.phase !== "move" || player.isBot || moves.length !== 1 || !isMyTurn) return;
    const only = moves[0];
    if (!only) return;
    const timer = window.setTimeout(() => {
      localActed.current = true;
      setGame((g) => commitMove(g, only));
    }, 420);
    return () => window.clearTimeout(timer);
  }, [game.phase, game.turn, game.dice, player.isBot, moves, commitMove, isMyTurn]);

  // إشعار يحين الدور
  const lastTurnRef = useRef<number | null>(null);
  useEffect(() => {
    if (inRoom && isMyTurn && !player.isBot && game.phase === "roll") {
      if (lastTurnRef.current !== game.turn) {
        lastTurnRef.current = game.turn;
        sfx.myTurn();
        haptics.impact("medium");
        toast.success("دورك الآن!", {
          id: "turn_notify",
          duration: 2000,
          position: "top-center",
        });
      }
    }
  }, [inRoom, isMyTurn, player.isBot, game.phase, game.turn]);

  // ===== المرحلة 12: مؤقت 15 ثانية بتوقيت السيرفر =====
  const timerActive = screen === "game" && game.phase !== "over" && !player.isBot && isMyTurn;

  useEffect(() => {
    if (!timerActive) {
      setDeadline(null);
      return;
    }
    let alive = true;
    warned.current = 0;
    setRemaining(gameplay.turnSeconds);
    void openTurn({ data: { matchId: matchId.current, turn: game.turn } })
      .then((res) => {
        if (!alive) return;
        clockOffset.current = res.serverNow - Date.now();
        turnSig.current = res.sig;
        setDeadline(res.deadline);
        setServerSynced(true);
      })
      .catch(() => {
        if (!alive) return;
        turnSig.current = null;
        setDeadline(Date.now() + gameplay.turnSeconds * 1000);
        setServerSynced(false);
      });
    return () => {
      alive = false;
    };
    // بداية دور جديدة لكل لاعب
  }, [timerActive, game.turn, openTurn, gameplay.turnSeconds]);

  useEffect(() => {
    if (!timerActive || deadline === null) return;
    const turnNo = game.turn;
    const tick = window.setInterval(() => {
      const left = (deadline - (Date.now() + clockOffset.current)) / 1000;
      setRemaining(Math.max(0, left));
      const whole = Math.ceil(left);
      if (whole <= 5 && whole >= 1 && warned.current !== whole) {
        warned.current = whole;
        sfx.warn();
        haptics.tap();
      }
      if (left <= 0) {
        window.clearInterval(tick);
        const sig = turnSig.current;
        const finish = () => {
          sfx.timeout();
          haptics.turnPass();
          setDeadline(null);
          setVerified(false);
          rollingRef.current = false;
          setRolling(false);
          localActed.current = true;
          setGame((g) => {
            const next = forfeitTurn(g);
            if (inRoom && matchChannel.current) {
              stateVersion.current += 1;
              void matchChannel.current.send({
                type: "broadcast",
                event: "state",
                payload: {
                  v: stateVersion.current,
                  state: next,
                  serverTimestamp: Date.now() + clockOffset.current,
                },
              });
            }
            return next;
          });
        };
        finish();
        if (sig) {
          void endTurn({ data: { matchId: matchId.current, turn: turnNo, deadline, sig } }).catch(
            () => {},
          );
        }
      }
    }, 180);
    return () => window.clearInterval(tick);
  }, [timerActive, deadline, game.turn, endTurn]);

  // ===== مزامنة مباراة الغرفة لحظيًا بين أجهزة اللاعبين مع معالجة تأخير السيرفر وتصحيح الحالة =====
  useEffect(() => {
    if (!inRoom || screen !== "game" || !matchId.current) return;
    const channel = supabase
      .channel(`match:${matchId.current}`, { config: { broadcast: { self: false, ack: true } } })
      .on("broadcast", { event: "chat" }, ({ payload }) => {
        const data = payload as
          | {
              id?: string;
              senderSeat: number;
              author: string;
              kind: "text" | "quick" | "emoji" | "voice";
              text?: string;
              audioUrl?: string;
              seconds?: number;
              at?: number;
            }
          | undefined;
        if (!data || typeof data.senderSeat !== "number") return;

        sfx.chat();
        haptics.tap();

        const bubbleId = data.id || crypto.randomUUID();
        const displayText =
          data.kind === "voice" ? `🎤 رسالة صوتية (${data.seconds ?? 1}ث)` : data.text || "";

        // إظهار فقاعة المحادثة فوراً فوق أفتار اللاعب صاحب المقعد في شاشة جميع اللاعبين
        setChatBubbles((prev) => ({
          ...prev,
          [data.senderSeat]: {
            id: bubbleId,
            text: displayText,
            kind: data.kind,
            author: data.author,
          },
        }));

        // دمج الرسالة في نافذة وسجل المحادثة
        setIncomingChatMessage({
          id: bubbleId,
          mine: false,
          author: data.author,
          kind: data.kind,
          text: data.text,
          audioUrl: data.audioUrl,
          seconds: data.seconds,
          at: data.at || Date.now(),
        });

        // إخفاء الفقاعة بعد 4.5 ثوانٍ
        window.setTimeout(() => {
          setChatBubbles((prev) => {
            if (prev[data.senderSeat]?.id === bubbleId) {
              const next = { ...prev };
              delete next[data.senderSeat];
              return next;
            }
            return prev;
          });
        }, 4500);
      })
      .on("broadcast", { event: "rolling" }, ({ payload }) => {
        const info = payload as RollBroadcastPayload | undefined;
        remoteRollStartedAt.current = Date.now();
        remoteRollDuration.current = info?.duration ?? 650;
        setRolling(true);
        rollingRef.current = true;
        sfx.diceRoll();
        haptics.diceRoll();
      })
      .on("broadcast", { event: "sync_req" }, ({ payload }) => {
        const req = payload as SyncRequestPayload | undefined;
        if (!req || stateVersion.current <= req.fromVersion) return;
        // إرسال لقطة كاملة من الحالة لتصحيح فقدان الحزم لدى الطرف الآخر
        void channel.send({
          type: "broadcast",
          event: "sync_resp",
          payload: { v: stateVersion.current, state: gameRef.current, responderSeat: seatIndex },
        });
      })
      .on("broadcast", { event: "sync_resp" }, ({ payload }) => {
        const resp = payload as SyncResponsePayload | undefined;
        if (!resp?.state || resp.v <= stateVersion.current) return;
        // تطبيق تصحيح الحالة (State Reconciliation) فور استلامها
        stateVersion.current = resp.v;
        localActed.current = false;
        if (remoteRollTimer.current) {
          window.clearTimeout(remoteRollTimer.current);
          remoteRollTimer.current = null;
        }
        rollingRef.current = false;
        setRolling(false);
        setGame(resp.state);
      })
      .on("broadcast", { event: "state" }, ({ payload }) => {
        const data = payload as StateBroadcastPayload;
        if (!data?.state || data.v <= stateVersion.current) return;

        // كشف فقدان الحزم (Packet Loss Detection):
        // إذا كان رقم الإصدار الواصل أعلى بأكثر من 1 من الإصدار الحالي، نطلب مزامنة تصحيحية
        if (data.v > stateVersion.current + 1) {
          void channel.send({
            type: "broadcast",
            event: "sync_req",
            payload: { fromVersion: stateVersion.current, requesterSeat: seatIndex },
          });
        }

        stateVersion.current = data.v;
        localActed.current = false;

        const prevPhase = gameRef.current.phase;
        const prevDice = gameRef.current.dice;
        const isDiceRollUpdate =
          data.rollCompleted ||
          (data.state.dice !== null && (prevPhase === "roll" || prevDice !== data.state.dice));

        if (isDiceRollUpdate) {
          const now = Date.now();
          const started = remoteRollStartedAt.current ?? now;
          const duration = remoteRollDuration.current ?? 650;
          const elapsed = now - started;
          const remainingRollTime = Math.max(0, duration - elapsed);

          // إذا لم تكن حركة دوران النرد قد بدأت لدى هذا الجهاز، نشغلها فورًا
          if (!rollingRef.current) {
            setRolling(true);
            rollingRef.current = true;
            sfx.diceRoll();
            haptics.diceRoll();
          }

          if (remoteRollTimer.current) window.clearTimeout(remoteRollTimer.current);

          // إذا كان باقي من وقت الدوران فترة كافية، نترك النرد يكمل حركته ليتطابق مع شاشة الخصم تماماً
          if (remainingRollTime > 60) {
            remoteRollTimer.current = window.setTimeout(() => {
              rollingRef.current = false;
              setRolling(false);
              setGame(data.state);
              if (data.state.dice) {
                sfx.diceLand(data.state.dice);
                haptics.diceLand();
              }
            }, remainingRollTime);
            return;
          }
        }

        if (remoteRollTimer.current) {
          window.clearTimeout(remoteRollTimer.current);
          remoteRollTimer.current = null;
        }
        rollingRef.current = false;
        setRolling(false);
        setGame(data.state);
        if (data.state.dice && isDiceRollUpdate) {
          sfx.diceLand(data.state.dice);
          haptics.diceLand();
        }
      })
      .subscribe();
    matchChannel.current = channel;
    return () => {
      if (remoteRollTimer.current) {
        window.clearTimeout(remoteRollTimer.current);
        remoteRollTimer.current = null;
      }
      matchChannel.current = null;
      void supabase.removeChannel(channel);
    };
  }, [inRoom, screen, seatIndex]);

  // فحص دوري لتصحيح حالة اللعبة (State Reconciliation) مع السيرفر عبر state version
  useEffect(() => {
    if (!inRoom || screen !== "game" || !matchId.current) return;
    const mid = matchId.current;
    const interval = window.setInterval(() => {
      void reconcileState({ data: { matchId: mid, clientVersion: stateVersion.current } })
        .then((verdict) => {
          if (!verdict) return;
          if (verdict.serverVersion > stateVersion.current) {
            const ch = matchChannel.current;
            if (ch) {
              void ch.send({
                type: "broadcast",
                event: "sync_req",
                payload: { fromVersion: stateVersion.current, requesterSeat: seatIndex },
              });
            }
          }
        })
        .catch(() => {});
    }, 6000);

    return () => window.clearInterval(interval);
  }, [inRoom, screen, reconcileState, seatIndex]);

  // بث الحالة بعد كل حركة أقوم بها حتى تظهر فورًا عند الخصم + تحديث رقم النسخة في السيرفر
  useEffect(() => {
    if (!inRoom || !localActed.current) return;
    localActed.current = false;
    const channel = matchChannel.current;
    if (!channel) return;
    stateVersion.current += 1;
    const currentV = stateVersion.current;
    void channel.send({
      type: "broadcast",
      event: "state",
      payload: { v: currentV, state: game },
    });
    if (matchId.current) {
      void reconcileState({ data: { matchId: matchId.current, clientVersion: currentV } }).catch(
        () => {},
      );
    }
  }, [game, inRoom, reconcileState]);

  // احتفال + حفظ النتيجة (يتم التحقق منها في السيرفر وتخزينها محلياً ودائماً)
  useEffect(() => {
    if (game.phase !== "over" || game.winner === null) return;
    clearActiveMatch();
    setSavedMatch(null);
    sfx.win();
    haptics.win();
    showCelebration(4200);

    const mySeat = inRoom
      ? game.players[seatIndex]?.seat
      : game.players.find((p) => !p.isBot)?.seat;
    if (mySeat !== undefined) {
      const didWin = game.winner === mySeat;
      reportMatch({
        result: didWin ? "win" : "loss",
        players: game.players.length,
        moves: moveCount.current,
        mode: "ludo",
      });

      // حفظ التقدم المحلي الدائم للمستخدم
      saveUserLocalProgress(user?.id, {
        games: (profile?.games ?? 0) + 1,
        wins: didWin ? (profile?.wins ?? 0) + 1 : (profile?.wins ?? 0),
        losses: !didWin ? (profile?.losses ?? 0) + 1 : (profile?.losses ?? 0),
        xp: (profile?.xp ?? 0) + (didWin ? 80 : 25),
        points: (profile?.points ?? 0) + (didWin ? 30 : 5),
        gold: (profile?.gold ?? 0) + (didWin ? 500 : 50),
      });

      // إدارة تقدم وجوائز البطولة المحفوظة
      if (activeTournament) {
        const outcome = recordTournamentMatchOutcome(user?.id, activeTournament, didWin);
        if (didWin) {
          if (outcome.isChampion) {
            toast.success(
              `👑 مبارك! أنت بطل ${activeTournament.name} وتوجت بالكأس! +${outcome.awardedGold} ذهب و+${outcome.awardedDiamonds} ماسة!`,
            );
          } else {
            toast.success(
              `🏆 فوز مستحق! تأهلت إلى ${getRoundName(outcome.newRound)} في ${activeTournament.name}`,
            );
          }
        } else {
          toast.info(
            `انتهت مشاركتك في ${activeTournament.name} عند ${getRoundName(activeTournament.round)} — حظاً أوفر في البطولة القادمة!`,
          );
        }
        setActiveTournament(null);
      }

      if (didWin) {
        triggerSmartWinPopup({
          winnerName: user ? (profile?.display_name ?? "البطل") : "أنت",
          coinsWon: 200,
          xpWon: 75,
          badgeUnlocked: "أفضل لاعب",
          onContinue: () => startGame(),
          onViewBadges: () => navigate("account"),
        });
      }
    }
  }, [game.phase, game.winner, game.players, inRoom, seatIndex, reportMatch, showCelebration, activeTournament, user?.id, profile]);

  const handleSendChat = useCallback(
    (msg: {
      kind: "text" | "quick" | "emoji" | "voice";
      text?: string;
      audioUrl?: string;
      seconds?: number;
    }) => {
      const mySeat =
        (inRoom && seatIndex >= 0
          ? game.players[seatIndex]?.seat
          : game.players.find((p) => !p.isBot)?.seat) ?? 0;

      const myName =
        (inRoom && seatIndex >= 0
          ? game.players[seatIndex]?.name
          : game.players.find((p) => !p.isBot)?.name) ??
        profile?.display_name ??
        "أنا";

      const bubbleId = crypto.randomUUID();
      const displayText = msg.kind === "voice" ? `🎤 صوت (${msg.seconds ?? 1}ث)` : msg.text || "";

      // 1) إظهار فقاعة المحادثة فوراً فوق أفتار اللاعب (أنا)
      setChatBubbles((prev) => ({
        ...prev,
        [mySeat]: {
          id: bubbleId,
          text: displayText,
          kind: msg.kind,
          author: myName,
        },
      }));

      // إخفاء الفقاعة تلقائياً بعد 4.5 ثوانٍ
      window.setTimeout(() => {
        setChatBubbles((prev) => {
          if (prev[mySeat]?.id === bubbleId) {
            const next = { ...prev };
            delete next[mySeat];
            return next;
          }
          return prev;
        });
      }, 4500);

      // 2) بث الرسالة عبر القناة المباشرة لجميع الخصوم في الغرفة
      if (inRoom && matchChannel.current) {
        void matchChannel.current.send({
          type: "broadcast",
          event: "chat",
          payload: {
            id: bubbleId,
            senderSeat: mySeat,
            author: myName,
            kind: msg.kind,
            text: msg.text,
            audioUrl: msg.audioUrl,
            seconds: msg.seconds,
            at: Date.now(),
          },
        });
      }

      // 3) في حال اللعب مع الروبوتات: رد تفاعلي ذكي يظهر فوق رأس الروبوت
      if (!inRoom) {
        const botOpponents = game.players.filter((p) => p.isBot);
        if (botOpponents.length > 0 && Math.random() < 0.85) {
          const chosenBot = botOpponents[Math.floor(Math.random() * botOpponents.length)]!;
          const botReplies =
            msg.kind === "emoji"
              ? ["👑", "🎲", "🔥", "🤝", "👏", "😎", "🎯"]
              : [
                  "لعبة رائعة! 🎲",
                  "بالتوفيق يا بطل 👍",
                  "ركّز باللعب 😎",
                  "ستة قادمة! 🔥",
                  "🤝",
                  "تحياتي 👑",
                ];
          const botReplyText = botReplies[Math.floor(Math.random() * botReplies.length)]!;

          window.setTimeout(
            () => {
              const botBubbleId = crypto.randomUUID();
              sfx.chat();
              setChatBubbles((prev) => ({
                ...prev,
                [chosenBot.seat]: {
                  id: botBubbleId,
                  text: botReplyText,
                  kind: msg.kind === "emoji" ? "emoji" : "quick",
                  author: chosenBot.name,
                },
              }));

              setIncomingChatMessage({
                id: botBubbleId,
                mine: false,
                author: chosenBot.name,
                kind: msg.kind === "emoji" ? "emoji" : "quick",
                text: botReplyText,
                at: Date.now(),
              });

              window.setTimeout(() => {
                setChatBubbles((prev) => {
                  if (prev[chosenBot.seat]?.id === botBubbleId) {
                    const next = { ...prev };
                    delete next[chosenBot.seat];
                    return next;
                  }
                  return prev;
                });
              }, 4500);
            },
            1200 + Math.random() * 800,
          );
        }
      }
    },
    [inRoom, seatIndex, game.players, profile?.display_name],
  );

  if (stage === "splash") {
    return (
      <SplashScreen
        onDone={() => {
          if (typeof window !== "undefined") {
            window.sessionStorage?.setItem("abqor_splash_done", "1");
          }
          setStage(guestReady() || user ? "app" : "gate");
        }}
      />
    );
  }

  if (stage === "gate" && !user && !guest) {
    return (
      <GateScreen
        onSignIn={() => {
          setStage("app");
          setScreen("account");
        }}
        onSignUp={() => {
          setStage("app");
          setScreen("account");
        }}
        onGuest={() => {
          markGuest();
          setGuest(true);
          setStage("app");
          setScreen("home");
        }}
      />
    );
  }

  if (screen === "domino") {
    return (
      <>
        <ExitConfirm
          open={exitAsk}
          onCancel={() => setExitAsk(false)}
          onConfirm={() => {
            setExitAsk(false);
            exitMatch();
          }}
        />
        <DominoGame
          playerCount={playerCount}
          humanCount={humanCount}
          muted={muted}
          onMute={() => toggleMute()}
          onHome={() => setExitAsk(true)}
          onFinish={({ winnerSeat, mySeat, players, moves }) => {
            showCelebration(3200);
            const didWin = winnerSeat === mySeat;
            reportMatch({
              result: didWin ? "win" : "loss",
              players,
              moves,
              mode: "domino",
            });
            if (didWin) {
              triggerSmartWinPopup({
                winnerName: user ? (profile?.display_name ?? "البطل") : "أنت",
                coinsWon: 150,
                xpWon: 60,
                badgeUnlocked: "قاهر النرد",
                onContinue: () => navigate("home"),
                onViewBadges: () => navigate("account"),
              });
            }
          }}
        />
      </>
    );
  }

  if (screen === "game") {
    return (
      <>
        <ExitConfirm
          open={exitAsk}
          onCancel={() => setExitAsk(false)}
          onConfirm={() => {
            setExitAsk(false);
            clearActiveMatch();
            setSavedMatch(null);
            setActiveTournament(null);
            exitMatch();
          }}
        />
        <GameScreen
          tournamentInfo={activeTournament}
          state={game}
          moves={moves}
          rolling={rolling}
          muted={muted}
          celebrate={celebrate}
          events={events}
          verified={verified}
          remaining={remaining}
          timerActive={timerActive}
          serverSynced={serverSynced}
          mySeatIndex={inRoom ? seatIndex : -1}
          myTurn={isMyTurn}
          meName={
            (inRoom ? game.players[seatIndex]?.name : game.players.find((p) => !p.isBot)?.name) ??
            "أنا"
          }
          turnSeconds={gameplay.turnSeconds}
          chatContext={{
            myTurn: !player.isBot,
            secondsLeft: Math.ceil(remaining),
            lastEvent: events.length
              ? events[events.length - 1]!.kind === "capture"
                ? "capture"
                : events[events.length - 1]!.kind === "home"
                  ? "home"
                  : events[events.length - 1]!.kind === "enter"
                    ? "six"
                    : null
              : null,
          }}
          chatBubbles={chatBubbles}
          incomingChatMessage={incomingChatMessage}
          onSendChatMessage={handleSendChat}
          onMute={() => toggleMute()}

          onRoll={handleRoll}
          onToken={handleToken}
          onHome={() => setExitAsk(true)}
          onRules={() => navigate("rules")}
          onRestart={startGame}
        />
      </>
    );
  }

  return (
    <div className="ludo-shell min-h-screen" dir="rtl">
      <Starfield />
      <SmartPopups
        onJoinRoom={(roomCode) => {
          setInviteCode(roomCode);
          setRoomsKey((k) => k + 1);
          navigate("rooms");
        }}
      />
      <DailyRewardModal
        isOpen={dailyRewardOpen}
        onClose={() => setDailyRewardOpen(false)}
        autoOpened={autoDailyTriggered}
      />
      <div className="relative mx-auto min-h-screen w-full max-w-md px-3 pb-24 pt-3 sm:pt-5">
        {screen !== "home" && (
          <TopBar
            muted={muted}
            onMute={() => toggleMute()}
            onMenu={() => navigate("home")}
            onAccount={() => navigate("account")}
          />
        )}
        {screen === "home" && <AnnouncementBar />}
        {screen === "home" && (
          <HomeScreen
            navigate={navigate}
            quickPlay={startSolo}
            isAdmin={isAdmin}
            onOpenDailyReward={() => setDailyRewardOpen(true)}
            dailyAvailable={dailyAvailable}
            savedMatch={savedMatch}
            onResumeMatch={handleResumeSavedMatch}
            onDismissSavedMatch={handleDismissSavedMatch}
          />
        )}
        {screen === "setup" && (
          <SetupScreen
            players={playerCount}
            humans={humanCount}
            setPlayers={setPlayerCount}
            setHumans={setHumanCount}
            onStart={startGame}
            onBack={() => navigate("home")}
          />
        )}
        {screen === "rooms" && (
          <PanelPage title="غرف اللعب" icon={<Users />} onBack={() => navigate("home")}>
            <Button variant="play" className="mb-3 w-full" onClick={() => navigate("matchmaking")}>
              <Users className="size-4" /> البحث عن لاعب (مباراة سريعة)
            </Button>
            <RoomsPanel
              key={roomsKey}
              meId={user?.id ?? null}
              onLaunch={launchRoomMatch}
              initialCode={inviteCode}
            />
          </PanelPage>
        )}
        {screen === "friend1v1" && (
          <Friend1v1Screen
            onBack={() => navigate("home")}
            onOpenRoom={(code) => {
              setInviteCode(code);
              navigate("rooms");
            }}
          />
        )}
        {screen === "live" && (
          <LivePlayersScreen
            onBack={() => navigate("home")}
            onSpectate={(roomId) => {
              setInviteCode(roomId);
              navigate("rooms");
            }}
          />
        )}
        {screen === "matchmaking" && (
          <PanelPage title="البحث عن لاعب" icon={<Users />} onBack={() => navigate("home")}>
            <MatchmakingScreen
              mode="ludo"
              maxPlayers={playerCount}
              onJoined={(code) => {
                setInviteCode(code);
                navigate("rooms");
              }}
              onCancel={() => navigate("home")}
            />
          </PanelPage>
        )}
        {screen === "rewards" && (
          <PanelPage title="المكافآت والجوائز" icon={<Gift />} onBack={() => navigate("home")}>
            <RewardsScreen onBack={() => navigate("home")} />
          </PanelPage>
        )}
        {screen === "tournaments" && (
          <PanelPage title="البطولات والكؤوس" icon={<Trophy />} onBack={() => navigate("home")}>
            <TournamentsScreen
              onBack={() => navigate("home")}
              onStartTournamentMatch={(t, round) => {
                setActiveTournament({
                  id: t.id,
                  name: t.name,
                  icon: t.icon,
                  round: round,
                  roundNumber: round === "champion" ? 4 : round === "final" ? 3 : round === "semi" ? 2 : 1,
                  prizeGold: t.prizeGold,
                  prizeDiamonds: t.prizeDiamonds,
                });
                setPlayerCount(4);
                startSolo(4);
              }}
            />
          </PanelPage>
        )}
        {screen === "rules" && (
          <PanelPage title="قواعد اللعبة" icon={<BookOpen />} onBack={() => navigate("home")}>
            <RulesContent />
          </PanelPage>
        )}
        {screen === "leaderboard" && (
          <PanelPage title="لوحة المتصدرين" icon={<ListOrdered />} onBack={() => navigate("home")}>
            <Leaderboard meId={user?.id ?? null} />
          </PanelPage>
        )}
        {screen === "history" && (
          <PanelPage title="سجل المباريات" icon={<History />} onBack={() => navigate("home")}>
            <MatchHistory meId={user?.id ?? null} />
          </PanelPage>
        )}
        {screen === "settings" && (
          <PanelPage title="الإعدادات" icon={<Settings />} onBack={() => navigate("home")}>
            <AccountLinkCard onOpenAccount={() => navigate("account")} />
            <SettingsPanel
              muted={muted}
              volume={volume}
              animations={animations}
              haptics={haptic}
              gameplay={gameplay}
              onGameplay={changeGameplay}
              onMuted={(v) => toggleMute(v)}
              onVolume={changeVolume}
              onAnimations={changeAnimations}
              onHaptics={changeHaptics}
            />
            <div className="mt-3 grid gap-2">
              <Button variant="royal" className="w-full" onClick={() => navigate("dice")}>
                <Layers className="size-4" /> تخصيص النرد
              </Button>
              <Button variant="royal" className="w-full" onClick={() => navigate("support")}>
                <BookOpen className="size-4" /> المساعدة والدعم
              </Button>
              <Button variant="royal" className="w-full" onClick={() => navigate("notifications")}>
                <Bell className="size-4" /> الإشعارات
                {unreadCount > 0 && (
                  <span className="ms-1 grid min-w-6 place-items-center rounded-full bg-ludo-ruby px-1 text-[11px] font-black text-ludo-soft">
                    {unreadCount}
                  </span>
                )}
              </Button>
              <Button variant="royal" className="w-full" onClick={() => navigate("profile")}>
                <UserCircle2 className="size-4" /> الملف الشخصي
              </Button>
              <Button variant="royal" className="w-full" onClick={() => navigate("invites")}>
                <Bell className="size-4" /> دعوات اللعب
              </Button>
              <Button variant="royal" className="w-full" onClick={() => navigate("wallet")}>
                <Gift className="size-4" /> المحفظة والاقتصاد
              </Button>
              <Button variant="royal" className="w-full" onClick={() => navigate("security")}>
                <ShieldCheck className="size-4" /> الحماية والأمان
              </Button>
            </div>
          </PanelPage>
        )}
        {screen === "missions" && (
          <PanelPage title="المهام" icon={<Target />} onBack={() => navigate("home")}>
            <MissionsPanel signedIn={Boolean(user)} onWalletChange={() => void refreshProfile()} />
          </PanelPage>
        )}
        {screen === "friends" && (
          <PanelPage title="الأصدقاء" icon={<Users />} onBack={() => navigate("home")}>
            <FriendsScreen onInvite={() => navigate("rooms")} />
          </PanelPage>
        )}
        {screen === "notifications" && (
          <PanelPage title="الإشعارات" icon={<Bell />} onBack={() => navigate("home")}>
            <NotificationsScreen />
          </PanelPage>
        )}
        {screen === "achievements" && (
          <PanelPage title="الإنجازات" icon={<Medal />} onBack={() => navigate("home")}>
            <AchievementsScreen />
          </PanelPage>
        )}
        {screen === "dice" && (
          <PanelPage title="تخصيص النرد" icon={<Layers />} onBack={() => navigate("home")}>
            <DiceSkinScreen />
          </PanelPage>
        )}
        {screen === "season" && (
          <PanelPage title="الموسم الملكي" icon={<Crown />} onBack={() => navigate("home")}>
            <SeasonScreen onRewards={() => navigate("rewards")} />
          </PanelPage>
        )}
        {screen === "support" && (
          <PanelPage title="المساعدة والدعم" icon={<BookOpen />} onBack={() => navigate("home")}>
            <SupportScreen />
          </PanelPage>
        )}
        {screen === "store" && (
          <PanelPage title="المتجر" icon={<Gift />} onBack={() => navigate("home")}>
            <StoreScreen />
          </PanelPage>
        )}
        {screen === "chests" && (
          <PanelPage title="الصناديق" icon={<Gift />} onBack={() => navigate("home")}>
            <ChestsPanel
              signedIn={Boolean(user)}
              animations={animations}
              onWalletChange={() => void refreshProfile()}
            />
          </PanelPage>
        )}
        {screen === "ledger" && (
          <PanelPage title="سجل المعاملات" icon={<History />} onBack={() => navigate("home")}>
            <LedgerPanel signedIn={Boolean(user)} />
          </PanelPage>
        )}
        {screen === "opened" && (
          <PanelPage title="الصناديق المفتوحة" icon={<Gift />} onBack={() => navigate("home")}>
            <OpenedChestsPanel signedIn={Boolean(user)} />
          </PanelPage>
        )}
        {screen === "admin" && (
          <PanelPage title="لوحة التحكم" icon={<ShieldCheck />} onBack={() => navigate("home")}>
            <AdminPanel />
          </PanelPage>
        )}
        {screen === "apk" && (
          <PanelPage
            title="تنزيل ملف الـ APK المباشر"
            icon={<Smartphone />}
            onBack={() => navigate("home")}
          >
            {isAdmin ? (
              <ApkManagerSection />
            ) : (
              <div className="p-6 text-center text-sm text-ludo-soft">
                هذه الصفحة مخصصة لمسؤول التطبيق فقط.
              </div>
            )}
          </PanelPage>
        )}
        {screen === "profile" && (
          <PanelPage title="الملف الشخصي" icon={<UserCircle2 />} onBack={() => navigate("home")}>
            <ProfileScreen
              onHistory={() => navigate("history")}
              onGoToStore={() => navigate("store")}
            />
          </PanelPage>
        )}
        {screen === "invites" && (
          <PanelPage title="دعوات اللعب" icon={<Bell />} onBack={() => navigate("home")}>
            <InvitesScreen
              onJoin={(code) => {
                setInviteCode(code);
                navigate("rooms");
              }}
            />
          </PanelPage>
        )}
        {screen === "wallet" && (
          <PanelPage title="نظام الاقتصاد" icon={<Gift />} onBack={() => navigate("home")}>
            <WalletScreen onStore={() => navigate("store")} />
          </PanelPage>
        )}
        {screen === "security" && (
          <PanelPage title="الحماية والأمان" icon={<ShieldCheck />} onBack={() => navigate("home")}>
            <SecurityScreen />
          </PanelPage>
        )}
        {screen === "account" && (
          <PanelPage title="حسابي" icon={<UserCircle2 />} onBack={() => navigate("home")}>
            <AuthPanel />
          </PanelPage>
        )}
        {screen !== "home" && <BottomNav active={screen} navigate={navigate} />}
      </div>
      {celebrate && <Confetti />}
      <ReconnectOverlay
        onResync={async () => {
          await refreshProfile();
          setRoomsKey((k) => k + 1);
        }}
      />
    </div>
  );
}

const GUEST_KEY = "abqor-guest";
function guestReady() {
  return typeof window !== "undefined" && window.localStorage.getItem(GUEST_KEY) === "1";
}
function markGuest() {
  if (typeof window !== "undefined") window.localStorage.setItem(GUEST_KEY, "1");
}

function TopBar({
  muted,
  onMute,
  onMenu,
  onAccount,
}: {
  muted: boolean;
  onMute: () => void;
  onMenu: () => void;
  onAccount: () => void;
}) {
  const { profile, user } = useAuth();
  const { hasNewFrames } = useFrameStore();
  const xp = (profile?.xp ?? 0) % 300;
  return (
    <header className="space-y-2">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
        <button type="button" onClick={onAccount} className="relative group" aria-label="حسابي">
          {/* شارة إشعار باللون الأحمر عند توفر إطارات جديدة في المتجر */}
          {hasNewFrames && (
            <span
              className="absolute -top-1 -right-1 z-30 flex size-3.5 items-center justify-center rounded-full bg-rose-500 ring-2 ring-[#220720] shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse"
              title="إطارات جديدة متوفرة في المتجر!"
            >
              <span className="size-1.5 rounded-full bg-white" />
            </span>
          )}
          <span className="level-orb overflow-visible flex items-center justify-center">
            <AvatarFrame
              frameId={profile?.frame}
              avatar={profile?.avatar || avatarTiger}
              size="sm"
            />
          </span>
          <span className="level-chip">{user ? `مستوى ${profile?.level ?? 1}` : "دخول"}</span>
        </button>
        <div className="min-w-0">
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onAccount}
              className="hud-pill press-3d reflect-gloss"
              aria-label="الذهب"
            >
              <img src={coinStack} alt="الذهب" width={512} height={512} loading="lazy" />
              <b className="hud-num">{user ? (profile?.gold ?? 0).toLocaleString("en-US") : 0}</b>
              <span className="hud-plus">+</span>
            </button>
            <button
              type="button"
              onClick={onAccount}
              className="hud-pill hud-gem press-3d reflect-gloss"
              aria-label="الجواهر"
            >
              <img src={gemEmerald} alt="الجواهر" width={512} height={512} loading="lazy" />
              <b className="hud-num">
                {user ? (profile?.diamonds ?? 0).toLocaleString("en-US") : 0}
              </b>
              <span className="hud-plus">+</span>
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="xp-track flex-1">
              <span className="xp-fill" style={{ width: `${(xp / 300) * 100}%` }} />
            </div>
            <small className="shrink-0 text-[10px] font-bold text-ludo-gold">{xp}/300 XP</small>
          </div>
        </div>
        <div className="grid gap-1">
          <Button
            variant="neonIcon"
            size="icon"
            className="press-3d"
            aria-label="القائمة"
            onClick={onMenu}
          >
            <Menu />
          </Button>
          <Button
            variant="neonIcon"
            size="icon"
            aria-label={muted ? "تشغيل الصوت" : "كتم الصوت"}
            onClick={onMute}
          >
            {muted ? <VolumeX /> : <Volume2 />}
          </Button>
        </div>
      </div>
      <Brand />
    </header>
  );
}

function Brand() {
  return (
    <div className="min-w-0 text-center flex flex-col items-center justify-center pt-0.5">
      <AnimatedRoyalDice size="sm" className="mx-auto" />
      <h1 className="truncate font-display text-xl sm:text-2xl font-black text-ludo-gold text-shadow-glow mt-1">
        ABQOR LUDO
      </h1>
      <p className="-mt-1 text-[11px] font-bold text-ludo-pink">عبقور لودو</p>
    </div>
  );
}

function HotSpot({
  label,
  onClick,
  style,
}: {
  label: string;
  onClick: () => void;
  style: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="hotspot absolute rounded-2xl outline-none transition active:scale-[.96] focus-visible:ring-2 focus-visible:ring-white/70"
      style={{ ...style, position: "absolute" }}
    />
  );
}

function HomeScreen({
  navigate,
  quickPlay,
  isAdmin,
  onOpenDailyReward,
  dailyAvailable,
  savedMatch,
  onResumeMatch,
  onDismissSavedMatch,
}: {
  navigate: (s: Screen) => void;
  quickPlay: (players: number) => void;
  isAdmin?: boolean;
  onOpenDailyReward?: () => void;
  dailyAvailable?: boolean;
  savedMatch?: SavedMatchState | null;
  onResumeMatch?: () => void;
  onDismissSavedMatch?: () => void;
}) {
  const { profile, user } = useAuth();
  return (
    <main
      className="relative -mx-3 -mt-3 flex min-h-[100dvh] flex-col items-center justify-start bg-cover bg-center overflow-x-hidden pb-20"
      style={{
        backgroundImage: "radial-gradient(circle at 50% 0%, #5c1244, #1a0511 80%)",
      }}
    >
      {/* الشريط العلوي */}
      <header className="z-10 flex w-full items-center justify-between border-b border-ludo-gold/30 bg-black/50 px-3 py-2.5 backdrop-blur-md">
        <button
          onClick={() => navigate("account")}
          className="flex shrink-0 items-center gap-2 rounded-full border border-ludo-gold/50 bg-black/60 py-1 pl-3 pr-1.5 shadow-sm transition active:scale-95 hover:border-ludo-gold"
        >
          {user ? (
            profile?.avatar &&
            (profile.avatar.startsWith("data:") || profile.avatar.startsWith("http")) ? (
              <img
                src={profile.avatar}
                className="size-8 shrink-0 rounded-full border border-ludo-gold bg-ludo-deep object-cover shadow-sm"
                alt="Avatar"
              />
            ) : profile?.avatar && profile.avatar.length <= 3 ? (
              <span className="grid size-8 place-items-center rounded-full border border-ludo-gold bg-ludo-deep text-sm">
                {profile.avatar}
              </span>
            ) : (
              <img
                src={avatarTiger}
                className="size-8 shrink-0 rounded-full border border-ludo-gold bg-ludo-deep object-cover"
                alt="Avatar"
              />
            )
          ) : (
            <img
              src={avatarTiger}
              className="size-8 shrink-0 rounded-full border border-ludo-gold bg-ludo-deep"
              alt="Avatar"
            />
          )}
          <div className="flex flex-col text-right">
            <span className="text-xs font-black text-ludo-gold leading-tight whitespace-nowrap">
              {user ? `مستوى ${profile?.level ?? 1}` : "دخول"}
            </span>
            {user && (
              <span className="text-[9px] font-bold text-amber-300/80 leading-tight">
                الملف الشخصي
              </span>
            )}
          </div>
        </button>

        <div className="flex items-center justify-end gap-1.5 min-w-0">
          <button
            type="button"
            onClick={() => navigate("chests")}
            className="hud-pill press-3d reflect-gloss"
            aria-label="الذهب"
          >
            <img src={coinStack} alt="Gold" width={512} height={512} loading="lazy" />
            <b className="hud-num">{user ? (profile?.gold ?? 0).toLocaleString("en-US") : 0}</b>
            <span className="hud-plus">+</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("chests")}
            className="hud-pill hud-gem press-3d reflect-gloss"
            aria-label="الجواهر"
          >
            <img src={gemEmerald} alt="Gems" width={512} height={512} loading="lazy" />
            <b className="hud-num">{user ? (profile?.diamonds ?? 0).toLocaleString("en-US") : 0}</b>
            <span className="hud-plus">+</span>
          </button>
          <button
            onClick={() => navigate("settings")}
            className="grid size-8 shrink-0 place-items-center rounded-full border border-ludo-gold/40 bg-black/50 transition active:scale-95 hover:border-ludo-gold"
            aria-label="الإعدادات"
          >
            <img src={navSettings} className="size-4" alt="Settings" />
          </button>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <div className="flex w-full flex-1 flex-col items-center gap-4 overflow-y-auto px-4 pb-24 pt-3">
        <div className="flex flex-col items-center justify-center text-center gap-1.5 my-1 pt-2">
          <AnimatedRoyalDice size="lg" />
          <div className="flex flex-col items-center">
            <h2 className="font-display text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ffe484] via-[#f6c32c] to-[#e49b13] drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] tracking-wide">
              عبقور لودو
            </h2>
            <p className="text-[11px] font-bold text-amber-200/80 tracking-widest -mt-0.5">
              ABQOR LUDO ROYAL
            </p>
          </div>
        </div>

        {/* بطاقة استئناف المباراة المحفوظة تلقائياً */}
        {savedMatch && (
          <div className="w-full rounded-2xl border-2 border-amber-400/80 bg-gradient-to-r from-amber-500/25 via-purple-950/70 to-black/80 p-3.5 shadow-[0_8px_20px_rgba(0,0,0,0.5)] flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-3 min-w-0">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-400/20 border border-amber-400/40 text-2xl shadow-inner">
                ⚡
              </div>
              <div className="min-w-0 text-right">
                <b className="text-xs font-black text-amber-300 block truncate">
                  لديك مباراة جارية محفوظة!
                </b>
                <span className="text-[11px] text-ludo-soft block truncate">
                  {savedMatch.tournamentInfo
                    ? `بطولة ${savedMatch.tournamentInfo.name} (${getRoundName((savedMatch.tournamentInfo.round as TournamentRound) || "quarter")})`
                    : `مباراة لودو (${savedMatch.playerCount} لاعبين)`}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="play"
                size="sm"
                onClick={onResumeMatch}
                className="text-xs font-black shadow-md px-3"
              >
                استئناف اللعب
              </Button>
              <Button
                variant="ghostGold"
                size="sm"
                onClick={onDismissSavedMatch}
                className="text-[10px] text-ludo-soft px-2"
              >
                تخطي
              </Button>
            </div>
          </div>
        )}

        {/* أزرار اللعب السريع */}
        <div className="flex w-full gap-4 mt-2">
          <button
            onClick={() => quickPlay(2)}
            className="flex flex-1 flex-col items-center gap-2 rounded-[1.5rem] border-2 border-ludo-gold bg-gradient-to-b from-[#8d2a72] to-[#360a28] p-4 text-center shadow-[0_8px_16px_rgba(0,0,0,0.5),inset_0_2px_10px_rgba(255,255,255,0.2)] transition hover:brightness-110 active:scale-95"
          >
            <img src={mode2p} className="h-20 object-contain drop-shadow-lg" alt="2 Players" />
            <span className="font-display text-lg font-bold text-ludo-gold drop-shadow-md">
              لعب 2 لاعبان
            </span>
          </button>
          <button
            onClick={() => navigate("setup")}
            className="flex flex-1 flex-col items-center gap-2 rounded-[1.5rem] border-2 border-ludo-gold bg-gradient-to-b from-[#8d2a72] to-[#360a28] p-4 text-center shadow-[0_8px_16px_rgba(0,0,0,0.5),inset_0_2px_10px_rgba(255,255,255,0.2)] transition hover:brightness-110 active:scale-95"
          >
            <img src={mode4p} className="h-20 object-contain drop-shadow-lg" alt="4 Players" />
            <span className="font-display text-lg font-bold text-ludo-gold drop-shadow-md">
              لعب 4 لاعبين
            </span>
          </button>
        </div>

        {/* زر التحديات والغرف */}
        <button
          onClick={() => navigate("rooms")}
          className="flex w-full items-center justify-between rounded-2xl border border-ludo-gold/50 bg-gradient-to-r from-ludo-pink to-ludo-purple p-3 shadow-[0_4px_12px_rgba(0,0,0,0.4)] transition active:scale-95"
        >
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-xl bg-black/20">
              <img
                src={modeDomino}
                className="size-9 object-contain drop-shadow-md"
                alt="Friends"
              />
            </div>
            <div className="text-right">
              <h3 className="font-display text-lg font-bold text-white drop-shadow-sm">
                العب مع أصدقائك
              </h3>
              <p className="text-[0.7rem] text-ludo-gold/80">غرف خاصة وتحديات الأصدقاء</p>
            </div>
          </div>
          <span className="rounded-full bg-ludo-gold px-4 py-1.5 text-sm font-bold text-ludo-deep shadow-sm">
            الآن
          </span>
        </button>

        {/* بطاقة المكافأة اليومية الملكية */}
        {/* بطاقة المكافأة اليومية الملكية */}
        <button
          id="home-daily-reward-card"
          type="button"
          onClick={() => {
            sfx.tap();
            onOpenDailyReward?.();
          }}
          className={cn(
            "relative flex w-full items-center justify-between overflow-hidden rounded-2xl border-2 p-3 transition-all active:scale-95 text-right group",
            dailyAvailable
              ? "border-amber-300 bg-gradient-to-r from-[#7a185e] via-[#430833] to-[#1c0215] animate-golden-pulse cursor-pointer shadow-[0_6px_22px_rgba(255,215,0,0.45)]"
              : "border-ludo-gold/70 bg-gradient-to-r from-[#6b1652] via-[#3a082c] to-[#1a0214] opacity-95 hover:border-ludo-gold shadow-[0_6px_18px_rgba(255,215,0,0.25)]",
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                "relative grid size-12 shrink-0 place-items-center rounded-xl border transition-all shadow-md",
                dailyAvailable
                  ? "border-amber-300 bg-gradient-to-br from-amber-400/30 to-black/60 shadow-[0_0_12px_rgba(255,215,0,0.6)]"
                  : "border-ludo-gold/50 bg-gradient-to-br from-ludo-gold/20 to-black/50",
              )}
            >
              <img src={giftBox} className="size-8 object-contain drop-shadow-md" alt="Gift" />
              {dailyAvailable && (
                <span className="absolute -top-1 -right-1 flex size-3.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-90"></span>
                  <span className="relative inline-flex size-3.5 rounded-full bg-amber-500 border-2 border-white"></span>
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-bold text-white drop-shadow-sm truncate">
                  المكافأة اليومية
                </h3>
                {dailyAvailable ? (
                  <span className="rounded-full bg-amber-400/25 border border-amber-300 px-2 py-0.5 text-[10px] font-black text-yellow-300 animate-pulse whitespace-nowrap shadow-sm">
                    جاهزة للاستلام! 🎁
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-400 whitespace-nowrap">
                    مُستلمة اليوم ✓
                  </span>
                )}
              </div>
              <p className="text-[0.72rem] text-ludo-gold/90 font-medium truncate mt-0.5">
                {dailyAvailable
                  ? "سجّل دخولك الآن واستلم قطع الذهب المجانية!"
                  : "عُد غداً لليوم التالي لزيادة السلسلة والذهب الملكي"}
              </p>
            </div>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-black shadow-md transition-all group-hover:scale-105",
              dailyAvailable
                ? "bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-600 text-black border border-yellow-200 animate-golden-btn-pulse"
                : "bg-gradient-to-b from-ludo-gold to-amber-600 text-ludo-deep",
            )}
          >
            {dailyAvailable ? "استلام 🪙" : "معاينة"}
          </span>
        </button>

        {/* شبكة الأزرار الدائرية الملكية */}
        <div className="grid w-full grid-cols-4 gap-3 place-items-center">
          {[
            { id: "live", icon: diceRoyal, label: "مباشر", isLive: true },
            { id: "store", icon: navStore, label: "الحقيبة" },
            { id: "tournaments", icon: navTrophy, label: "بطولات" },
            { id: "missions", icon: modeMissions, label: "المهام" },
            { id: "rewards", icon: giftBox, label: "مكافآت" },
            { id: "season", icon: navTrophy, label: "الموسم" },
            { id: "dice", icon: diceRoyal, label: "النرد" },
            { id: "rules", icon: navSettings, label: "القواعد" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                sfx.tap();
                if (item.id === "rewards" && onOpenDailyReward) {
                  onOpenDailyReward();
                } else {
                  navigate(item.id as Screen);
                }
              }}
              className="relative flex aspect-square w-full max-w-[76px] flex-col items-center justify-center rounded-full border-2 border-ludo-gold/80 bg-gradient-to-b from-[#6b1652] via-[#3a082c] to-[#1a0214] p-1 shadow-[0_4px_12px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,215,0,0.4)] transition-all duration-150 active:scale-90 hover:border-ludo-gold hover:shadow-[0_0_15px_rgba(255,215,0,0.5)] touch-manipulation cursor-pointer z-10 select-none group"
              aria-label={item.label}
            >
              {item.isLive && (
                <span className="absolute top-1 right-1 flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex size-2.5 rounded-full bg-red-500 border border-white/80"></span>
                </span>
              )}
              {item.id === "rewards" && dailyAvailable && (
                <span className="absolute top-1 right-1 flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-80"></span>
                  <span className="relative inline-flex size-2.5 rounded-full bg-amber-500 border border-white/80"></span>
                </span>
              )}
              <img
                src={item.icon}
                className="size-7 sm:size-8 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)] transition-transform group-hover:scale-105"
                alt={item.label}
              />
              <span className="text-[10px] sm:text-xs font-black text-amber-200 mt-0.5 tracking-tight text-center leading-none truncate w-full px-0.5">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* زر تنزيل ملف الـ APK المباشر — يظهر فقط للمسؤولين */}
        {isAdmin && (
          <div className="w-full px-1 pt-1">
            <button
              onClick={() => navigate("apk")}
              className="flex w-full items-center justify-between rounded-2xl border-2 border-ludo-gold/60 bg-gradient-to-r from-[#5a144e] via-[#31072a] to-[#160214] p-3 shadow-md transition active:scale-95 hover:border-ludo-gold"
            >
              <div className="flex items-center gap-2.5">
                <div className="grid size-10 place-items-center rounded-xl bg-ludo-gold/20 text-ludo-gold border border-ludo-gold/50">
                  <Smartphone className="size-5 animate-pulse" />
                </div>
                <div className="text-right">
                  <h4 className="text-sm font-black text-ludo-gold">تنزيل ملف الـ APK المباشر</h4>
                  <p className="text-[10px] text-ludo-soft">
                    لوحة المشرف: إدارة وتوزيع ملف اللعبة المباشر
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-ludo-gold px-3 py-1 text-xs font-black text-ludo-deep shadow-sm">
                تنزيل فوري 📥
              </span>
            </button>
          </div>
        )}

        {isAdmin && (
          <div className="px-3 pt-3 w-full">
            <Button variant="royal" size="xl" className="w-full" onClick={() => navigate("admin")}>
              لوحة تحكم المشرف
            </Button>
          </div>
        )}
      </div>

      {/* الشريط السفلي */}
      <nav className="fixed bottom-0 z-40 flex w-full max-w-md items-center justify-around rounded-t-3xl border-t border-ludo-gold/40 bg-[#160214]/95 px-2 pb-6 pt-2.5 backdrop-blur-xl shadow-[0_-5px_20px_rgba(0,0,0,0.8)] pointer-events-auto">
        <button
          id="nav-bag-button"
          type="button"
          onClick={() => {
            sfx.tap();
            navigate("store");
          }}
          className="flex min-h-[48px] min-w-[56px] flex-col items-center justify-center gap-1 rounded-xl p-1 text-amber-100/80 transition active:scale-90 hover:text-ludo-gold hover:opacity-100 touch-manipulation cursor-pointer"
          aria-label="الحقيبة"
        >
          <img src={navStore} className="size-6 drop-shadow-md" alt="الحقيبة" />
          <span className="text-[0.65rem] font-black text-amber-200">الحقيبة</span>
        </button>
        <button
          type="button"
          onClick={() => {
            sfx.tap();
            navigate("friends");
          }}
          className="flex min-h-[48px] min-w-[56px] flex-col items-center justify-center gap-1 rounded-xl p-1 text-white/70 transition active:scale-90 hover:text-white hover:opacity-100 touch-manipulation cursor-pointer"
          aria-label="الأصدقاء"
        >
          <img src={navFriends} className="size-6 drop-shadow-md" alt="الأصدقاء" />
          <span className="text-[0.65rem] font-bold text-white">الأصدقاء</span>
        </button>
        <button
          type="button"
          onClick={() => {
            sfx.tap();
            navigate("home");
          }}
          className="relative -mt-6 flex flex-col items-center gap-1 touch-manipulation cursor-pointer active:scale-90 transition"
          aria-label="الرئيسية"
        >
          <div className="grid place-items-center rounded-full border-2 border-black bg-gradient-to-b from-ludo-gold to-ludo-gold-dark p-3 shadow-[0_0_15px_rgba(255,215,0,0.5)]">
            <img src={navHome} className="size-7 brightness-0 drop-shadow" alt="الرئيسية" />
          </div>
          <span className="mt-0.5 text-[0.7rem] font-black text-ludo-gold drop-shadow-md">
            الرئيسية
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            sfx.tap();
            navigate("leaderboard");
          }}
          className="flex min-h-[48px] min-w-[56px] flex-col items-center justify-center gap-1 rounded-xl p-1 text-white/70 transition active:scale-90 hover:text-white hover:opacity-100 touch-manipulation cursor-pointer"
          aria-label="الترتيب"
        >
          <img src={navTrophy} className="size-6 drop-shadow-md" alt="الترتيب" />
          <span className="text-[0.65rem] font-bold text-white">الترتيب</span>
        </button>
        <button
          type="button"
          onClick={() => {
            sfx.tap();
            navigate("chests");
          }}
          className="relative flex min-h-[48px] min-w-[56px] flex-col items-center justify-center gap-1 rounded-xl p-1 text-white/70 transition active:scale-90 hover:text-white hover:opacity-100 touch-manipulation cursor-pointer"
          aria-label="الصناديق"
        >
          <img src={chestClosed} className="size-6 drop-shadow-md" alt="الصناديق" />
          <span className="text-[0.65rem] font-bold text-white">الصناديق</span>
          <span className="absolute right-2 top-1 size-2.5 rounded-full border border-black bg-red-500 shadow-sm animate-pulse" />
        </button>
      </nav>
    </main>
  );
}

function StatPill({
  icon,
  value,
  onClick,
}: {
  icon: React.ReactNode;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press-3d flex items-center gap-1 rounded-full border border-ludo-gold/60 bg-ludo-plum px-2 py-1 text-xs font-black text-ludo-soft shadow-[0_3px_0_#25061f]"
    >
      {icon}
      <span className="tabular-nums">{value}</span>
      <span className="grid size-4 place-items-center rounded-full bg-ludo-green text-[10px] text-white">
        <Plus className="size-3" />
      </span>
    </button>
  );
}

function SideButton({
  img,
  label,
  badge,
  onClick,
}: {
  img: string;
  label: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="press-3d relative grid size-14 place-items-center rounded-xl border-2 border-ludo-gold/80 bg-[linear-gradient(180deg,#5c1b52,#3a0d31)] shadow-[0_4px_0_#25061f]"
    >
      <img src={img} alt="" width={512} height={512} className="asset-shine size-9" />
      {badge && (
        <span className="absolute -end-1 -top-1 grid size-5 place-items-center rounded-full bg-ludo-ruby text-[10px] font-black text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

function BigModeCard({
  tone,
  img,
  title,
  onClick,
}: {
  tone: string;
  img: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("mode-tile press-3d reflect-gloss min-h-[9.5rem]", `tile-${tone}`)}
    >
      <img src={img} alt="" width={512} height={512} loading="lazy" />
      <b className="text-lg">{title}</b>
    </button>
  );
}

function MiniModeCard({
  img,
  title,
  icon,
  onClick,
}: {
  img: string;
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press-3d reflect-gloss relative grid place-items-center gap-1 rounded-2xl border-2 border-ludo-gold/40 bg-[linear-gradient(180deg,#6b2160,#3a0d31)] p-2 shadow-[0_5px_0_#25061f,0_10px_18px_rgb(0_0_0/.4)]"
    >
      <span className="absolute -top-2 grid size-6 place-items-center rounded-full border border-ludo-gold/70 bg-ludo-plum text-ludo-gold">
        {icon}
      </span>
      <img
        src={img}
        alt=""
        width={512}
        height={512}
        loading="lazy"
        className="asset-shine size-12"
      />
      <small className="text-center text-[10px] font-bold leading-tight text-ludo-soft">
        {title}
      </small>
    </button>
  );
}

function SetupScreen({
  players,
  humans,
  setPlayers,
  setHumans,
  onStart,
  onBack,
}: {
  players: 2 | 3 | 4;
  humans: number;
  setPlayers: (v: 2 | 3 | 4) => void;
  setHumans: (v: number) => void;
  onStart: () => void;
  onBack: () => void;
}) {
  return (
    <PanelPage title="تجهيز الطاولة" icon={<Users />} onBack={onBack}>
      <p className="mb-3 text-center text-sm text-ludo-soft">
        اختر عدد المشاركين واللاعبين الحقيقيين
      </p>
      <SettingBlock title="عدد اللاعبين">
        <div className="grid grid-cols-3 gap-2">
          {([2, 3, 4] as const).map((n) => (
            <Button
              key={n}
              variant={players === n ? "royal" : "neon"}
              onClick={() => {
                setPlayers(n);
                setHumans(Math.min(humans, n));
              }}
            >
              {n} لاعبين
            </Button>
          ))}
        </div>
      </SettingBlock>
      <SettingBlock title="اللاعبون المحليون">
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4]
            .filter((n) => n <= players)
            .map((n) => (
              <Button
                key={n}
                variant={humans === n ? "royal" : "neon"}
                onClick={() => setHumans(n)}
              >
                {n}
              </Button>
            ))}
        </div>
        <p className="mt-3 text-xs text-ludo-soft">سيكمل الروبوت المقاعد المتبقية تلقائيًا</p>
      </SettingBlock>
      <Button variant="play" size="xl" className="mt-5 w-full" onClick={onStart}>
        ابدأ اللعبة <Crown />
      </Button>
    </PanelPage>
  );
}

export function PanelPage({
  title,
  icon,
  onBack,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <main className="royal-panel glow-rise mt-4 p-3">
      <header className="title-ribbon mb-4 grid grid-cols-[auto_1fr_auto] items-center">
        <Button variant="ghostGold" size="icon" onClick={onBack}>
          <ChevronLeft className="rotate-180" />
        </Button>
        <h2 className="flex items-center justify-center gap-2 text-xl">
          {icon}
          {title}
        </h2>
        <span className="size-9" />
      </header>
      {children}
    </main>
  );
}

function SettingBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-3 rounded-xl border border-ludo-gold/35 bg-ludo-panel/70 p-3">
      <h3 className="mb-3 font-bold text-ludo-gold">{title}</h3>
      {children}
    </section>
  );
}

function BottomNav({ active, navigate }: { active: Screen; navigate: (s: Screen) => void }) {
  const links: [Screen, string, string][] = [
    ["store", navStore, "المتجر"],
    ["friends", navFriends, "الأصدقاء"],
    ["home", navHome, "الصفحة الرئيسية"],
    ["leaderboard", navTrophy, "الأندية"],
    ["opened", chestOpen, "جوائز"],
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto grid w-full max-w-md grid-cols-5 gap-1 border-t-2 border-ludo-gold/70 bg-[linear-gradient(180deg,#5c1b52,#2c0824)] px-2 pb-[max(.45rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgb(0_0_0/.55)]">
      {links.map(([id, icon, label]) => (
        <button
          type="button"
          key={id}
          onClick={() => navigate(id)}
          className={cn("nav-3d press-3d", active === id && "nav-3d-active")}
        >
          <img src={icon} alt="" width={512} height={512} loading="lazy" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function GameScreen({
  tournamentInfo,
  state,
  moves,
  rolling,
  muted,
  celebrate,
  events,
  verified,
  remaining,
  timerActive,
  serverSynced,
  mySeatIndex,
  myTurn: myTurnProp,
  meName,
  turnSeconds,
  chatContext,
  chatBubbles,
  incomingChatMessage,
  onSendChatMessage,
  onMute,
  onRoll,
  onToken,
  onHome,
  onRules,
  onRestart,
}: {
  tournamentInfo?: {
    name: string;
    icon: string;
    round: TournamentRound;
    prizeGold: number;
  } | null;
  state: GameState;
  moves: ReturnType<typeof legalMoves>;
  rolling: boolean;
  muted: boolean;
  celebrate: boolean;
  events: MatchEvent[];
  verified: boolean;
  remaining: number;
  timerActive: boolean;
  serverSynced: boolean;
  mySeatIndex: number;
  myTurn: boolean;
  meName: string;
  turnSeconds: number;
  chatContext?: ChatContext | undefined;
  chatBubbles: Record<number, ChatBubbleData>;
  incomingChatMessage: ChatMessage | null;
  onSendChatMessage: (msg: {
    kind: "text" | "quick" | "emoji" | "voice";
    text?: string;
    audioUrl?: string;
    seconds?: number;
  }) => void;
  onMute: () => void;
  onRoll: () => void;
  onToken: (id: string) => void;
  onHome: () => void;
  onRules: () => void;
  onRestart: () => void;
}) {
  const { profile } = useAuth();
  const player = currentPlayer(state);
  const seat = SEATS[player.seat];
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTab, setChatTab] = useState<"quick" | "emoji" | "text">("quick");

  // ترتيب المقاعد كما في التصميم: أنا بالأسفل يمين اللوحة، والخصوم بالأعلى/الأسفل المقابل
  const mySeat =
    (mySeatIndex >= 0
      ? state.players[mySeatIndex]?.seat
      : state.players.find((p) => !p.isBot)?.seat) ?? 0;
  const others = state.players.filter((p) => p.seat !== mySeat);
  const me = state.players.find((p) => p.seat === mySeat) ??
    state.players[0] ?? {
      seat: mySeat,
      name: meName || "أنا",
      isBot: false,
      color: "ruby" as const,
      tokens: [],
    };
  const topLeft = others[1] ?? null;
  const topRight = others[0] ?? null;
  const bottomRight = others[2] ?? null;

  const myTurn = myTurnProp && player.seat === mySeat && !player.isBot;
  const pct = timerActive ? Math.max(0, Math.min(1, remaining / turnSeconds)) : 1;

  return (
    <div className="ludo-shell min-h-screen" dir="rtl">
      <Starfield />
      <div className="crown-pattern fixed inset-0" aria-hidden="true" />
      <main className="relative mx-auto flex min-h-screen w-full max-w-xl flex-col px-3 pb-3 pt-2">
        {/* شريط علوي: قائمة، الفوز، مشاهدون، ثم الجواهر */}
        <div className="room-top-bar">
          <button
            type="button"
            className="room-pill press-3d"
            aria-label="الرئيسية"
            onClick={onHome}
          >
            <Menu className="size-5" />
          </button>
          <button
            type="button"
            className="room-pill press-3d"
            aria-label="القواعد والفوز"
            onClick={onRules}
          >
            <Trophy className="size-5" />
          </button>
          <button
            type="button"
            className="room-pill press-3d"
            aria-label="المشاهدون"
            onClick={() => {
              setChatTab("quick");
              setChatOpen(true);
            }}
          >
            <Eye className="size-5" />
            <b>{events.length}</b>
          </button>
          <LiveVoiceButton roomId={`ludo-${state.players.length}`} meName={meName} />
          <button
            type="button"
            className="room-pill press-3d"
            aria-label={muted ? "تشغيل الصوت" : "كتم الصوت"}
            onClick={onMute}
          >
            {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>
          <span className="room-gems">
            <img src={coinStack} alt="" width={512} height={512} loading="lazy" />
            <b>{profile?.gold ?? 0}</b>
          </span>
          <span className="room-gems">
            <img src={gemEmerald} alt="" width={512} height={512} loading="lazy" />
            <b>{profile?.diamonds ?? 0}</b>
          </span>
        </div>

        {/* شارة البطولة الحالية إذا كانت المباراة ضمن بطولة */}
        {tournamentInfo && (
          <div className="mt-2 mx-auto flex items-center gap-2 rounded-full border border-ludo-gold/70 bg-gradient-to-r from-amber-500/20 via-purple-950/70 to-amber-500/20 px-3.5 py-1 text-xs shadow-md">
            <Trophy className="size-3.5 text-ludo-gold animate-bounce" />
            <b className="text-ludo-gold font-black">{tournamentInfo.name}</b>
            <span className="text-white/40">•</span>
            <span className="text-cyan-300 font-bold">{getRoundName(tournamentInfo.round)}</span>
            <span className="text-white/40">•</span>
            <span className="text-amber-300 font-bold">🏆 {tournamentInfo.prizeGold.toLocaleString("ar-EG")} ذهب</span>
          </div>
        )}

        {/* مقاعد الخصوم أعلى اللوحة مع مساحة رأسية لفقاعات الكلام */}
        <div className="mt-5 sm:mt-6 grid min-h-[5.6rem] grid-cols-2 items-end gap-2">
          <div className="justify-self-start">
            {topLeft && (
              <RoomSeat
                state={state}
                seatId={topLeft.seat}
                align="start"
                bubble={chatBubbles[topLeft.seat]}
              />
            )}
          </div>
          <div className="justify-self-end">
            {topRight && (
              <RoomSeat
                state={state}
                seatId={topRight.seat}
                align="end"
                bubble={chatBubbles[topRight.seat]}
              />
            )}
          </div>
        </div>

        <section className="board-wood reflect-gloss relative mx-auto my-1 w-full max-w-[min(94vw,34rem)]">
          <LudoBoard state={state} moves={moves} onTokenClick={onToken} />
        </section>

        {/* أنا بالأسفل مع حلقة المؤقت والنرد، والخصم المقابل يمينًا */}
        <div className="mt-2 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
          <div className="room-seat relative">
            <span className="room-name">{me.name}</span>
            <div className="flex items-center gap-2">
              <div className="relative flex items-center justify-center">
                {/* فقاعة المحادثة فوق رأس أفتار اللاعب (أنا) */}
                <PlayerChatBubble bubble={chatBubbles[mySeat]} align="start" />
                <span
                  className={cn(
                    "room-ring transition-all duration-300",
                    chatBubbles[mySeat] &&
                      "ring-2 ring-amber-400 shadow-[0_0_15px_rgba(255,215,0,0.6)] rounded-full",
                  )}
                  style={{
                    ["--seat" as string]: `var(--ludo-${SEATS[mySeat].token})`,
                    ["--pct" as string]: pct,
                  }}
                >
                  <span className="relative flex items-center justify-center">
                    {me.isBot ? (
                      <Bot className="size-6 text-ludo-gold" />
                    ) : (
                      <AvatarFrame
                        frameId={profile?.frame || "frame_default"}
                        avatar={profile?.avatar || "🦁"}
                        size="sm"
                      />
                    )}
                  </span>
                </span>
              </div>
              <span className="room-dice-bubble">
                <Dice
                  value={state.dice}
                  rolling={rolling}
                  disabled={state.phase !== "roll" || player.isBot || !myTurn}
                  onRoll={onRoll}
                  seatToken={seat.token}
                  verified={verified}
                />
              </span>
              <button
                type="button"
                className="room-pill press-3d"
                aria-label="جولة جديدة"
                onClick={onRestart}
              >
                <RotateCcw className="size-5" />
              </button>
            </div>
          </div>
          <div aria-hidden="true" />

          <div className="justify-self-end">
            {bottomRight && (
              <RoomSeat
                state={state}
                seatId={bottomRight.seat}
                align="end"
                bubble={chatBubbles[bottomRight.seat]}
              />
            )}
          </div>
        </div>

        {/* شريط حالة الدور والمؤقت بعرض كامل حتى لا يتراكم مع المقاعد */}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {myTurn && <span className="room-arrow" aria-hidden="true" />}
          <p className="text-xs font-bold text-ludo-gold">{state.message}</p>
          {timerActive && state.phase !== "over" && (
            <TurnTimer
              remaining={remaining}
              limit={15}
              name={player.name}
              serverSynced={serverSynced}
            />
          )}
        </div>

        {/* أزرار الدردشة والإيموجي كما في التصميم */}
        <div className="mt-3 flex items-center gap-2">
          <Button
            variant="neon"
            size="sm"
            className="press-3d"
            onClick={() => {
              setChatTab("emoji");
              setChatOpen(true);
              sfx.tap();
            }}
          >
            <Smile /> إيموجي
          </Button>
          <Button
            variant="neon"
            size="sm"
            className="press-3d"
            onClick={() => {
              setChatTab("text");
              setChatOpen(true);
              sfx.tap();
            }}
          >
            <MessageSquare /> الدردشة
          </Button>
          <span className="ms-auto flex items-center gap-1.5 rounded-full border border-ludo-gold/40 bg-ludo-panel/70 px-2 py-1 text-xs font-bold text-ludo-gold">
            <img
              src={coinStack}
              alt=""
              width={512}
              height={512}
              loading="lazy"
              className="size-5"
            />
            {profile?.gold ?? 0}
          </span>
        </div>

        {state.phase === "over" && (
          <MatchSummary
            winnerName={player.name}
            events={events}
            onRestart={onRestart}
            onHome={onHome}
          />
        )}
      </main>
      <MatchChat
        meName={meName}
        context={chatContext}
        open={chatOpen}
        onOpenChange={setChatOpen}
        tab={chatTab}
        hideFab
        onSendMessage={onSendChatMessage}
        incomingMessage={incomingChatMessage}
      />
      {celebrate && <Confetti />}
    </div>
  );
}

/** مقعد لاعب داخل الغرفة: صورة دائرية بإطار لونه لون المقعد + شريط الاسم + فقاعة محادثة فوق الرأس */
function RoomSeat({
  state,
  seatId,
  align,
  bubble,
}: {
  state: GameState;
  seatId: 0 | 1 | 2 | 3;
  align: "start" | "end";
  bubble?: ChatBubbleData | null;
}) {
  const { profile } = useAuth();
  const p = state.players.find((x) => x.seat === seatId);
  if (!p) return null;
  const s = SEATS[seatId];
  const active = currentPlayer(state).seat === seatId;

  const isSelf = !p.isBot && (p.name === (profile?.display_name || "أنت") || seatId === 0);
  const botFrames = [
    "frame_royal_gold",
    "frame_neon_cyan",
    "frame_dragon_fire",
    "frame_emerald_nature",
  ];
  const frameId = isSelf
    ? profile?.frame || "frame_default"
    : p.isBot
      ? botFrames[seatId % botFrames.length]
      : "frame_default";
  const avatarContent = isSelf ? profile?.avatar || "🦁" : p.isBot ? "🤖" : "👑";

  return (
    <div
      className={cn("room-seat relative", align === "end" ? "items-end" : "items-start")}
      style={{ ["--seat" as string]: `var(--ludo-${s.token})` }}
    >
      {/* فقاعة المحادثة فوق رأس اللاعب */}
      <PlayerChatBubble bubble={bubble} align={align} />
      <span
        className={cn(
          "room-avatar relative flex items-center justify-center p-0.5 transition-all duration-300",
          active && "room-avatar-active",
          bubble && "ring-2 ring-amber-400 shadow-[0_0_15px_rgba(255,215,0,0.6)]",
        )}
      >
        <AvatarFrame frameId={frameId} avatar={avatarContent} size="md" />
        <b className="absolute -top-1 -start-1 z-20 grid size-6 place-items-center rounded-full bg-ludo-panel/90 text-[10px] text-ludo-gold shadow-md">
          {tokensDone(state, seatId)}
        </b>
      </span>
      <span className="room-name">{p.name}</span>
    </div>
  );
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 46 }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.9,
        duration: 2 + Math.random() * 1.6,
        color: [
          "var(--ludo-gold)",
          "var(--ludo-pink)",
          "var(--ludo-palm)",
          "var(--ludo-lagoon)",
          "var(--ludo-ruby)",
        ][Math.floor(Math.random() * 5)],
      })),
    [],
  );
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <i
          key={i}
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

function Starfield() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div className="stars stars-a" />
      <div className="stars stars-b" />
    </div>
  );
}
