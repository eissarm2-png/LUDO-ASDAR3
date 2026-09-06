// مدير البطولات والتقدم المحفوظ لكل مستخدم
// Tournament Manager & Per-User Progress Tracker

export type TournamentRound = "quarter" | "semi" | "final" | "champion";

export type TournamentProgress = {
  tournamentId: string;
  round: TournamentRound;
  roundNumber: number; // 1: ربع النهائي, 2: نصف النهائي, 3: النهائي, 4: بطل
  wins: number;
  status: "in_progress" | "champion" | "eliminated";
  lastPlayedAt: number;
};

export type TournamentTrophy = {
  id: string;
  tournamentId: string;
  tournamentName: string;
  icon: string;
  prizeGold: number;
  prizeDiamonds: number;
  wonAt: number;
};

export type UserTournamentData = {
  userId: string;
  registeredIds: string[];
  progress: Record<string, TournamentProgress>;
  trophies: TournamentTrophy[];
  stats: {
    tournamentsPlayed: number;
    tournamentsWon: number;
    totalGoldWon: number;
    totalDiamondsWon: number;
  };
};

const ROUND_NAMES: Record<TournamentRound, string> = {
  quarter: "ربع النهائي (الدور الـ 8)",
  semi: "نصف النهائي (المربع الذهبي)",
  final: "المباراة النهائية الكبرى 🏆",
  champion: "بطل البطولة المتوج 👑",
};

export function getRoundName(round: TournamentRound): string {
  return ROUND_NAMES[round] || round;
}

function isStorageAvailable(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      typeof window.localStorage !== "undefined" &&
      window.localStorage !== null
    );
  } catch {
    return false;
  }
}

function getStorageKey(userId: string | null | undefined): string {
  const safeId = userId && userId.trim() ? userId.trim() : "guest_player";
  return `ludo_tournament_data_v2_${safeId}`;
}

export function loadUserTournamentData(userId: string | null | undefined): UserTournamentData {
  const key = getStorageKey(userId);
  if (isStorageAvailable()) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as UserTournamentData;
        return {
          userId: userId || "guest_player",
          registeredIds: Array.isArray(parsed.registeredIds) ? parsed.registeredIds : [],
          progress: parsed.progress || {},
          trophies: Array.isArray(parsed.trophies) ? parsed.trophies : [],
          stats: {
            tournamentsPlayed: parsed.stats?.tournamentsPlayed || 0,
            tournamentsWon: parsed.stats?.tournamentsWon || 0,
            totalGoldWon: parsed.stats?.totalGoldWon || 0,
            totalDiamondsWon: parsed.stats?.totalDiamondsWon || 0,
          },
        };
      }
    } catch (err) {
      console.warn("Error loading user tournament data:", err);
    }
  }

  return {
    userId: userId || "guest_player",
    registeredIds: [],
    progress: {},
    trophies: [],
    stats: {
      tournamentsPlayed: 0,
      tournamentsWon: 0,
      totalGoldWon: 0,
      totalDiamondsWon: 0,
    },
  };
}

export function saveUserTournamentData(data: UserTournamentData): void {
  if (!isStorageAvailable()) return;
  const key = getStorageKey(data.userId);
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn("Error saving user tournament data:", err);
  }
}

/** تسجيل اللاعب في بطولة جديدة وحفظها لحسابه */
export function registerUserInTournament(
  userId: string | null | undefined,
  tournamentId: string,
): UserTournamentData {
  const data = loadUserTournamentData(userId);
  if (!data.registeredIds.includes(tournamentId)) {
    data.registeredIds.push(tournamentId);
  }
  if (!data.progress[tournamentId] || data.progress[tournamentId].status === "eliminated") {
    data.progress[tournamentId] = {
      tournamentId,
      round: "quarter",
      roundNumber: 1,
      wins: 0,
      status: "in_progress",
      lastPlayedAt: Date.now(),
    };
    data.stats.tournamentsPlayed += 1;
  }
  saveUserTournamentData(data);
  return data;
}

/** تسجيل نتيجة مباراة بطولة: فوز أو خسارة مع الترقية للجولة التالية */
export function recordTournamentMatchOutcome(
  userId: string | null | undefined,
  tournament: {
    id: string;
    name: string;
    icon: string;
    prizeGold: number;
    prizeDiamonds: number;
  },
  isWin: boolean,
): {
  data: UserTournamentData;
  newRound: TournamentRound;
  isChampion: boolean;
  awardedGold: number;
  awardedDiamonds: number;
} {
  const data = loadUserTournamentData(userId);
  const prog = data.progress[tournament.id] || {
    tournamentId: tournament.id,
    round: "quarter" as TournamentRound,
    roundNumber: 1,
    wins: 0,
    status: "in_progress" as const,
    lastPlayedAt: Date.now(),
  };

  prog.lastPlayedAt = Date.now();

  let awardedGold = 0;
  let awardedDiamonds = 0;
  let isChampion = false;

  if (isWin) {
    prog.wins += 1;
    if (prog.round === "quarter") {
      prog.round = "semi";
      prog.roundNumber = 2;
    } else if (prog.round === "semi") {
      prog.round = "final";
      prog.roundNumber = 3;
    } else if (prog.round === "final") {
      prog.round = "champion";
      prog.roundNumber = 4;
      prog.status = "champion";
      isChampion = true;

      awardedGold = tournament.prizeGold;
      awardedDiamonds = tournament.prizeDiamonds;

      data.stats.tournamentsWon += 1;
      data.stats.totalGoldWon += awardedGold;
      data.stats.totalDiamondsWon += awardedDiamonds;

      // إضافة الكأس لسجل كؤوس المستخدم
      data.trophies.unshift({
        id: crypto.randomUUID(),
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        icon: tournament.icon,
        prizeGold: awardedGold,
        prizeDiamonds: awardedDiamonds,
        wonAt: Date.now(),
      });
    }
  } else {
    prog.status = "eliminated";
  }

  data.progress[tournament.id] = prog;
  saveUserTournamentData(data);

  return {
    data,
    newRound: prog.round,
    isChampion,
    awardedGold,
    awardedDiamonds,
  };
}
