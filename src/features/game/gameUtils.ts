import { createCategorySnapshot } from "@/features/categories/categoryUtils";
import type { Category, CategorySnapshot, Difficulty } from "@/features/categories/categoryTypes";
import type {
  AlphabetSettings,
  CategoryDrawSettings,
  DifficultyCounts,
  GameState,
  PlayStage,
  Player,
  RankingEntry,
  Round,
  ScoreEntry,
  TimerState,
} from "@/features/game/gameTypes";
import { createId } from "@/lib/ids";
import { normalizeWhitespace } from "@/lib/validation";

export const DEFAULT_ALPHABET_LETTERS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "Ł",
  "M",
  "N",
  "O",
  "P",
  "R",
  "S",
  "T",
  "U",
  "W",
  "Z",
  "Ż",
] as const;

export const OPTIONAL_POLISH_LETTERS = ["Ą", "Ć", "Ę", "Ń", "Ó", "Ś", "Ź"] as const;
export const EXTRA_GAME_LETTERS = ["Q", "V", "X", "Y"] as const;
export const ALL_SUPPORTED_LETTERS = [
  ...DEFAULT_ALPHABET_LETTERS,
  ...OPTIONAL_POLISH_LETTERS,
  ...EXTRA_GAME_LETTERS,
] as const;

export const PLAYER_ACCENTS = [
  "text-primary bg-primary/10 border-primary/25",
  "text-difficulty-classic bg-difficulty-classic/10 border-difficulty-classic/25",
  "text-difficulty-hard bg-difficulty-hard/10 border-difficulty-hard/25",
  "text-difficulty-medium bg-difficulty-medium/10 border-difficulty-medium/25",
  "text-difficulty-advanced bg-difficulty-advanced/10 border-difficulty-advanced/25",
  "text-sky-700 bg-sky-100 border-sky-200",
  "text-emerald-700 bg-emerald-100 border-emerald-200",
  "text-rose-700 bg-rose-100 border-rose-200",
  "text-cyan-700 bg-cyan-100 border-cyan-200",
  "text-violet-700 bg-violet-100 border-violet-200",
] as const;

export const DEFAULT_DRAW_SETTINGS: CategoryDrawSettings = {
  basic: 1,
  classic: 1,
  medium: 2,
  hard: 1,
  advanced: 0,
};

export const DEFAULT_TIMER: TimerState = {
  status: "idle",
  configuredDurationSeconds: 60,
  configuredFinishSeconds: 15,
  remainingSeconds: 60,
  endsAt: null,
  pausedPhase: null,
};

export function createDefaultAlphabetSettings(
  enabledLetters: string[] = [...DEFAULT_ALPHABET_LETTERS],
): AlphabetSettings {
  return {
    enabledLetters: normalizeEnabledLettersList(enabledLetters),
    defaultLetters: [...DEFAULT_ALPHABET_LETTERS],
  };
}

export function normalizeEnabledLettersList(enabledLetters: string[]) {
  const normalizedSet = new Set<string>();

  enabledLetters.forEach((letter) => {
    if (ALL_SUPPORTED_LETTERS.includes(letter as (typeof ALL_SUPPORTED_LETTERS)[number])) {
      normalizedSet.add(letter);
    }
  });

  return ALL_SUPPORTED_LETTERS.filter((letter) => normalizedSet.has(letter));
}

export function normalizeAlphabetSettings(settings?: Partial<AlphabetSettings> | null) {
  const defaults = createDefaultAlphabetSettings();
  const enabledLetters = normalizeEnabledLettersList(settings?.enabledLetters ?? defaults.enabledLetters);
  const defaultLetters = normalizeEnabledLettersList(settings?.defaultLetters ?? defaults.defaultLetters);

  return {
    enabledLetters: enabledLetters.length >= 2 ? enabledLetters : defaults.enabledLetters,
    defaultLetters: defaultLetters.length >= 2 ? defaultLetters : defaults.defaultLetters,
  } satisfies AlphabetSettings;
}

export function createPlayer(index: number, name = `Gracz ${index + 1}`): Player {
  return {
    id: createId(),
    name,
    colorIndex: index % PLAYER_ACCENTS.length,
    createdAt: new Date().toISOString(),
  };
}

export function createScoreEntry(total = 0, additions: number[] = total > 0 ? [total] : []) {
  return {
    total,
    additions,
  } satisfies ScoreEntry;
}

export function createScoreMap(players: Player[]) {
  return players.reduce<Record<string, ScoreEntry>>((scores, player) => {
    scores[player.id] = createScoreEntry();
    return scores;
  }, {});
}

export function createRound(
  number: number,
  players: Player[],
  timer: TimerState,
  categorySnapshot: CategorySnapshot[] = [],
): Round {
  return {
    id: createId(),
    number,
    letter: null,
    categorySnapshot: [...categorySnapshot],
    scores: createScoreMap(players),
    confirmedPlayerIds: [],
    durationSeconds: timer.configuredDurationSeconds,
    finishCountdownSeconds: timer.configuredFinishSeconds,
    status: "setup",
    createdAt: new Date().toISOString(),
    finishedAt: null,
  };
}

export function createDefaultGameState(players?: Player[]): GameState {
  const activePlayers = players?.length
    ? players.map((player, index) => ({
        ...player,
        colorIndex: index % PLAYER_ACCENTS.length,
      }))
    : [createPlayer(0, "Gracz 1"), createPlayer(1, "Gracz 2")];
  const firstRound = createRound(1, activePlayers, DEFAULT_TIMER, []);

  return {
    id: createId(),
    status: "active",
    players: activePlayers,
    rounds: [firstRound],
    activeRoundId: firstRound.id,
    selectedCategories: [],
    lockedCategoryIds: [],
    currentDrawnLetter: null,
    usedLetters: [],
    alphabetSettings: createDefaultAlphabetSettings(),
    categoryDrawSettings: DEFAULT_DRAW_SETTINGS,
    timer: DEFAULT_TIMER,
    soundEnabled: true,
    createdAt: new Date().toISOString(),
    finishedAt: null,
  };
}

export function getAvailableLetters(
  state: Pick<GameState, "alphabetSettings" | "usedLetters">,
) {
  const usedSet = new Set(state.usedLetters);
  return state.alphabetSettings.enabledLetters.filter((letter) => !usedSet.has(letter));
}

export function getRoundById(rounds: Round[], roundId: string) {
  return rounds.find((round) => round.id === roundId) ?? rounds[0];
}

export function getActiveRound(state: GameState) {
  return getRoundById(state.rounds, state.activeRoundId);
}

export function getRoundScore(round: Round | undefined, playerId: string) {
  if (!round) {
    return 0;
  }

  return round.scores[playerId]?.total ?? 0;
}

export function getPlayerInitial(name: string) {
  const words = normalizeWhitespace(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2);

  if (!words.length) {
    return "?";
  }

  if (words.length === 1) {
    return words[0]?.slice(0, 1).toLocaleUpperCase("pl-PL") ?? "?";
  }

  return words
    .map((word) => word.slice(0, 1).toLocaleUpperCase("pl-PL"))
    .join("")
    .slice(0, 2);
}

export function getPlayerTotal(state: Pick<GameState, "rounds">, playerId: string) {
  return state.rounds.reduce((sum, round) => sum + getRoundScore(round, playerId), 0);
}

export function getRanking(state: Pick<GameState, "players" | "rounds">): RankingEntry[] {
  const sorted = [...state.players]
    .map((player) => ({
      playerId: player.id,
      playerName: player.name,
      colorIndex: player.colorIndex,
      total: getPlayerTotal(state, player.id),
    }))
    .sort((left, right) => right.total - left.total || left.playerName.localeCompare(right.playerName, "pl"));

  let previousTotal: number | null = null;
  let previousPlace = 0;

  return sorted.map((entry, index, all) => {
    const place = previousTotal === entry.total ? previousPlace : index + 1;
    previousTotal = entry.total;
    previousPlace = place;
    const isTied = all.filter((candidate) => candidate.total === entry.total).length > 1;

    return {
      ...entry,
      place,
      isTied,
    };
  });
}

export function calculateScoreTotals(rounds: Round[]) {
  return rounds.reduce<Record<string, number>>((totals, round) => {
    Object.entries(round.scores).forEach(([playerId, scoreEntry]) => {
      totals[playerId] = (totals[playerId] ?? 0) + scoreEntry.total;
    });
    return totals;
  }, {});
}

export function getLeaderIds(rounds: Round[]) {
  const totals = calculateScoreTotals(rounds);
  const highestScore = Math.max(0, ...Object.values(totals));

  return Object.entries(totals)
    .filter(([, score]) => score === highestScore)
    .map(([playerId]) => playerId);
}

export function hasGameStarted(game: GameState) {
  return game.usedLetters.length > 0 || game.rounds.some(
    (round) => round.letter !== null || round.status === "running" || round.status === "finished",
  );
}

export function drawRandomLetter(letters: string[]) {
  if (!letters.length) {
    return null;
  }

  const index = Math.floor(Math.random() * letters.length);
  return letters[index] ?? null;
}

export function commitLetterSelection(state: GameState, letter: string) {
  const activeRound = getActiveRound(state);

  if (!activeRound || activeRound.letter || state.usedLetters.includes(letter)) {
    return state;
  }

  return {
    ...state,
    currentDrawnLetter: letter,
    usedLetters: [...state.usedLetters, letter],
    rounds: state.rounds.map((round) =>
      round.id === activeRound.id
        ? {
            ...round,
            letter,
          }
        : round,
    ),
  };
}

export function calculateScoreEntryTotal(additions: number[]) {
  return additions.reduce((sum, value) => sum + value, 0);
}

export function addScoreAddition(entry: ScoreEntry, value: number) {
  if (value === 0) {
    return createScoreEntry(0, []);
  }

  const additions = [...entry.additions, value];
  return createScoreEntry(calculateScoreEntryTotal(additions), additions);
}

export function undoLastScoreAddition(entry: ScoreEntry) {
  if (!entry.additions.length) {
    return entry;
  }

  const additions = entry.additions.slice(0, -1);
  return createScoreEntry(calculateScoreEntryTotal(additions), additions);
}

export function clearScoreEntry() {
  return createScoreEntry();
}

export function getDifficultyCounts(categories: Category[]): DifficultyCounts {
  return categories.reduce<DifficultyCounts>(
    (counts, category) => {
      if (category.isActive) {
        counts[category.difficulty] += 1;
      }
      return counts;
    },
    {
      basic: 0,
      classic: 0,
      medium: 0,
      hard: 0,
      advanced: 0,
    },
  );
}

export function clampDrawSettings(
  settings: CategoryDrawSettings,
  categories: Category[],
): CategoryDrawSettings {
  const counts = getDifficultyCounts(categories);

  return {
    basic: Math.max(0, Math.min(settings.basic, counts.basic)),
    classic: Math.max(0, Math.min(settings.classic, counts.classic)),
    medium: Math.max(0, Math.min(settings.medium, counts.medium)),
    hard: Math.max(0, Math.min(settings.hard, counts.hard)),
    advanced: Math.max(0, Math.min(settings.advanced, counts.advanced)),
  };
}

function getActiveCategoriesByDifficulty(categories: Category[]) {
  return categories
    .filter((category) => category.isActive)
    .reduce<Record<Difficulty, Category[]>>(
      (groups, category) => {
        groups[category.difficulty].push(category);
        return groups;
      },
      {
        basic: [],
        classic: [],
        medium: [],
        hard: [],
        advanced: [],
      },
    );
}

function drawUniqueCategories(
  categories: Category[],
  count: number,
  excludedIds: Set<string>,
) {
  const pool = categories.filter((category) => !excludedIds.has(category.id));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, count);

  picked.forEach((category) => excludedIds.add(category.id));

  return picked.map(createCategorySnapshot);
}

export function drawCategoriesBySettings(
  categories: Category[],
  settings: CategoryDrawSettings,
) {
  const grouped = getActiveCategoriesByDifficulty(categories);
  const excludedIds = new Set<string>();
  const result: CategorySnapshot[] = [];

  (Object.keys(settings) as Difficulty[]).forEach((difficulty) => {
    const requested = settings[difficulty];
    const available = grouped[difficulty].length;

    if (requested > available) {
      throw new Error("Brak wystarczającej liczby aktywnych kategorii.");
    }

    result.push(...drawUniqueCategories(grouped[difficulty], requested, excludedIds));
  });

  return result;
}

export function rerollSelectedCategories(
  categories: Category[],
  settings: CategoryDrawSettings,
  existingSnapshots: CategorySnapshot[],
  lockedIds: string[],
) {
  const grouped = getActiveCategoriesByDifficulty(categories);
  const lockedSet = new Set(lockedIds);
  const lockedSnapshots = existingSnapshots.filter((snapshot) => lockedSet.has(snapshot.id));
  const lockedCountByDifficulty = lockedSnapshots.reduce<Record<Difficulty, number>>(
    (counts, snapshot) => {
      counts[snapshot.difficulty] += 1;
      return counts;
    },
    {
      basic: 0,
      classic: 0,
      medium: 0,
      hard: 0,
      advanced: 0,
    },
  );

  const excludedIds = new Set<string>(lockedIds);
  const result = [...lockedSnapshots];

  (Object.keys(settings) as Difficulty[]).forEach((difficulty) => {
    const requested = settings[difficulty];
    const lockedCount = lockedCountByDifficulty[difficulty];

    if (lockedCount > requested) {
      throw new Error(
        `Za dużo zablokowanych kategorii w poziomie ${difficulty}. Zmniejsz blokady lub zwiększ liczbę losowanych kategorii.`,
      );
    }

    const remainingCount = requested - lockedCount;
    const pool = grouped[difficulty].filter((category) => !excludedIds.has(category.id));

    if (remainingCount > pool.length) {
      throw new Error("Brak wystarczającej liczby aktywnych kategorii.");
    }

    result.push(...drawUniqueCategories(pool, remainingCount, excludedIds));
  });

  return result;
}

export function rerollCategoryWithinDifficulty(
  categories: Category[],
  existingSnapshots: CategorySnapshot[],
  lockedIds: string[],
  targetCategoryId: string,
) {
  const target = existingSnapshots.find((snapshot) => snapshot.id === targetCategoryId);

  if (!target) {
    throw new Error("Nie znaleziono kategorii do ponownego losowania.");
  }

  if (lockedIds.includes(targetCategoryId)) {
    throw new Error("Ta kategoria jest zablokowana przed ponownym losowaniem.");
  }

  const excludedIds = new Set(
    existingSnapshots
      .filter((snapshot) => snapshot.id !== targetCategoryId)
      .map((snapshot) => snapshot.id),
  );

  const matchingPool = categories.filter(
    (category) =>
      category.isActive &&
      category.difficulty === target.difficulty &&
      !excludedIds.has(category.id) &&
      category.id !== targetCategoryId,
  );

  if (!matchingPool.length) {
    throw new Error("Brak alternatywnej kategorii w tym poziomie trudności.");
  }

  const nextCategory = matchingPool[Math.floor(Math.random() * matchingPool.length)];
  const nextSnapshot = createCategorySnapshot(nextCategory);

  return existingSnapshots.map((snapshot) =>
    snapshot.id === target.id ? nextSnapshot : snapshot,
  );
}

export function isRoundReadyToAdvance(round: Round) {
  const missing: string[] = [];

  if (!round.letter) {
    missing.push("wylosowanej litery");
  }

  return {
    canAdvance: missing.length === 0,
    missing,
  };
}

export function areAllScoresConfirmed(round: Round | undefined, players: Player[]) {
  if (!round) {
    return false;
  }

  return players.every((player) => round.confirmedPlayerIds.includes(player.id));
}

export function getPlayStage(
  game: GameState,
  options?: { isLetterDrawing?: boolean },
): PlayStage {
  const activeRound = getActiveRound(game);
  const isLetterDrawing = options?.isLetterDrawing ?? false;

  if (!activeRound) {
    return "prepare";
  }

  if (isLetterDrawing) {
    return "letter-draw";
  }

  if (!activeRound.letter) {
    return "prepare";
  }

  if (game.timer.status === "running") {
    return "running";
  }

  if (game.timer.status === "finishing") {
    return "finishing";
  }

  if (game.timer.status === "finished") {
    return areAllScoresConfirmed(activeRound, game.players) ? "round-complete" : "scoring";
  }

  return "ready";
}

export function deriveRemainingSeconds(timer: TimerState, now = Date.now()) {
  if (!timer.endsAt) {
    return timer.remainingSeconds;
  }

  return Math.max(0, Math.ceil((timer.endsAt - now) / 1000));
}

export function reconcileTimerState(timer: TimerState, now = Date.now()): TimerState {
  if (
    (timer.status === "running" || timer.status === "finishing") &&
    typeof timer.endsAt === "number"
  ) {
    const remainingSeconds = deriveRemainingSeconds(timer, now);

    if (remainingSeconds <= 0) {
      return {
        ...timer,
        status: "finished",
        remainingSeconds: 0,
        endsAt: null,
        pausedPhase: null,
      };
    }

    return {
      ...timer,
      remainingSeconds,
    };
  }

  return timer;
}

export function reconcileGameState(state: GameState, now = Date.now()): GameState {
  const timer = reconcileTimerState(state.timer, now);
  const alphabetSettings = normalizeAlphabetSettings(state.alphabetSettings);
  const activeRound = getActiveRound(state);
  const currentDrawnLetter = activeRound?.letter ?? null;

  if (timer.status !== "finished" || state.timer.status === "finished") {
    return {
      ...state,
      alphabetSettings,
      currentDrawnLetter,
      timer,
    };
  }

  return {
    ...state,
    alphabetSettings,
    currentDrawnLetter,
    timer,
    rounds: state.rounds.map((round) =>
      round.id === state.activeRoundId
        ? {
            ...round,
            status: "finished",
            finishedAt: round.finishedAt ?? new Date(now).toISOString(),
          }
        : round,
    ),
  };
}
