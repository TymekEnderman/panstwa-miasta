import { create } from "zustand";
import type { Category, CategorySnapshot, Difficulty } from "@/features/categories/categoryTypes";
import {
  addScoreAddition,
  clampDrawSettings,
  clearScoreEntry,
  commitLetterSelection,
  createDefaultAlphabetSettings,
  createDefaultGameState,
  createPlayer,
  createRound,
  createScoreEntry,
  drawCategoriesBySettings,
  getActiveRound,
  getAvailableLetters,
  getPlayerTotal,
  getRanking,
  getRoundById,
  getRoundScore,
  hasGameStarted,
  isRoundReadyToAdvance,
  normalizeAlphabetSettings,
  normalizeEnabledLettersList,
  PLAYER_ACCENTS,
  reconcileGameState,
  rerollCategoryWithinDifficulty,
  rerollSelectedCategories,
  undoLastScoreAddition,
} from "@/features/game/gameUtils";
import type {
  GameState,
  RankingEntry,
  Round,
  ScoreEntry,
  TimerState,
} from "@/features/game/gameTypes";
import {
  STORAGE_KEYS,
  backupStorageValue,
  loadVersionedValue,
  parseVersionedValue,
  pushHydrationWarning,
  readStorageItem,
  saveVersionedValue,
} from "@/lib/storage";
import { normalizeWhitespace, validatePlayerName } from "@/lib/validation";

type SettingsPersistedState = {
  soundEnabled: boolean;
};

type LegacyRound = {
  id: string;
  number: number;
  letter: string | null;
  categories?: CategorySnapshot[];
  categorySnapshot?: CategorySnapshot[];
  scores: Record<string, number | ScoreEntry>;
  confirmedPlayerIds?: string[];
  durationSeconds: number;
  finishCountdownSeconds: number;
  status: "setup" | "running" | "finished";
  createdAt: string;
  finishedAt: string | null;
};

type LegacyGameStateV1 = {
  id: string;
  status: "active" | "finished";
  players: GameState["players"];
  rounds: LegacyRound[];
  activeRoundId: string;
  currentDrawnLetter: string | null;
  usedLetters: string[];
  availableLetters: string[];
  categoryDrawSettings: GameState["categoryDrawSettings"];
  timer: GameState["timer"];
  soundEnabled?: boolean;
  createdAt: string;
  finishedAt: string | null;
  selectedCategories?: CategorySnapshot[];
  lockedCategoryIds?: string[];
};

type LegacyGameStateV2 = {
  id: string;
  status: "active" | "finished";
  players: GameState["players"];
  rounds: LegacyRound[];
  activeRoundId: string;
  selectedCategories: CategorySnapshot[];
  lockedCategoryIds: string[];
  currentDrawnLetter: string | null;
  usedLetters: string[];
  availableLetters: string[];
  categoryDrawSettings: GameState["categoryDrawSettings"];
  timer: GameState["timer"];
  soundEnabled: boolean;
  createdAt: string;
  finishedAt: string | null;
};

type GameStore = {
  game: GameState;
  setActiveRound: (roundId: string) => void;
  commitDrawnLetter: (letter: string) => { ok: boolean; message?: string };
  syncCategoryAvailability: (categories: Category[]) => void;
  setDrawSetting: (difficulty: Difficulty, value: number, categories: Category[]) => void;
  drawCategories: (categories: Category[]) => { ok: boolean; message?: string };
  rerollCategory: (
    categories: Category[],
    categoryId: string,
  ) => { ok: boolean; message?: string };
  rerollAllCategories: (categories: Category[]) => { ok: boolean; message?: string };
  toggleCategoryLock: (categoryId: string) => { ok: boolean; message?: string };
  updateAlphabet: (enabledLetters: string[]) => { ok: boolean; message?: string };
  addPlayer: (name?: string) => { ok: boolean; message?: string; playerId?: string };
  updatePlayerName: (
    playerId: string,
    name: string,
  ) => { ok: boolean; message?: string; changed?: boolean };
  removePlayer: (playerId: string) => { ok: boolean; message?: string; needsConfirm?: boolean };
  forceRemovePlayer: (playerId: string) => void;
  movePlayer: (playerId: string, direction: "left" | "right") => void;
  addScoreValue: (
    roundId: string,
    playerId: string,
    value: number,
  ) => { ok: boolean; message?: string; needsConfirm?: boolean };
  undoLastScoreAddition: (roundId: string, playerId: string) => { ok: boolean; message?: string };
  clearScore: (roundId: string, playerId: string) => void;
  toggleScoreConfirmed: (roundId: string, playerId: string) => void;
  addRound: () => { ok: boolean; message?: string; roundNumber?: number; roundId?: string };
  setTimerDuration: (seconds: number) => void;
  setFinishCountdown: (seconds: number) => void;
  startTimer: () => { ok: boolean; message?: string };
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  triggerFinishCountdown: () => { ok: boolean; message?: string };
  completeTimer: () => void;
  toggleSound: () => void;
  endGame: () => void;
  newGame: (options?: { preservePlayers?: boolean }) => void;
  getRoundScore: (roundId: string, playerId: string) => number;
  getPlayerTotal: (playerId: string) => number;
  getRanking: () => RankingEntry[];
};

function migrateScoreEntry(value: number | ScoreEntry | undefined) {
  if (typeof value === "number") {
    return createScoreEntry(value, value > 0 ? [value] : []);
  }

  if (!value) {
    return createScoreEntry();
  }

  if (typeof value.total === "number" && Array.isArray(value.additions)) {
    return createScoreEntry(value.total, value.additions);
  }

  return createScoreEntry();
}

function migrateRound(round: LegacyRound, fallbackCategories: CategorySnapshot[]): Round {
  return {
    ...round,
    categorySnapshot: round.categorySnapshot ?? round.categories ?? fallbackCategories,
    confirmedPlayerIds: round.confirmedPlayerIds ?? [],
    scores: Object.fromEntries(
      Object.entries(round.scores).map(([playerId, score]) => [playerId, migrateScoreEntry(score)]),
    ),
  };
}

function migrateAlphabetSettings(usedLetters: string[], availableLetters?: string[]) {
  const legacyEnabledLetters = [...(availableLetters ?? []), ...usedLetters];
  return normalizeAlphabetSettings({
    enabledLetters: legacyEnabledLetters.length
      ? legacyEnabledLetters
      : createDefaultAlphabetSettings().enabledLetters,
  });
}

function migrateLegacyGameState(
  legacyGame: LegacyGameStateV1 | LegacyGameStateV2,
  soundEnabled: boolean,
) {
  const fallbackCategories =
    legacyGame.selectedCategories ??
    legacyGame.rounds.find((round) => (round.categories?.length ?? 0) > 0)?.categories ??
    [];

  const migratedRounds = legacyGame.rounds.map((round) => migrateRound(round, fallbackCategories));
  const activeRound = migratedRounds.find((round) => round.id === legacyGame.activeRoundId) ?? migratedRounds[0];

  return reconcileGameState({
    id: legacyGame.id,
    status: legacyGame.status,
    players: legacyGame.players.map((player, index) => ({
      ...player,
      colorIndex: index % PLAYER_ACCENTS.length,
    })),
    rounds: migratedRounds,
    activeRoundId: activeRound?.id ?? migratedRounds[0]?.id ?? createDefaultGameState().activeRoundId,
    selectedCategories: fallbackCategories,
    lockedCategoryIds: legacyGame.lockedCategoryIds ?? [],
    currentDrawnLetter: activeRound?.letter ?? legacyGame.currentDrawnLetter ?? null,
    usedLetters: legacyGame.usedLetters,
    alphabetSettings: migrateAlphabetSettings(
      legacyGame.usedLetters,
      "availableLetters" in legacyGame ? legacyGame.availableLetters : undefined,
    ),
    categoryDrawSettings: legacyGame.categoryDrawSettings,
    timer: legacyGame.timer,
    soundEnabled,
    createdAt: legacyGame.createdAt,
    finishedAt: legacyGame.finishedAt,
  } satisfies GameState);
}

function loadInitialGame() {
  const defaultState = createDefaultGameState();
  const persistedSettings = loadVersionedValue<SettingsPersistedState>(
    STORAGE_KEYS.settings,
    { soundEnabled: defaultState.soundEnabled },
    2,
  );

  const currentGame = loadVersionedValue<GameState | null>(STORAGE_KEYS.game, null, 3);

  if (currentGame) {
    return reconcileGameState({
      ...currentGame,
      soundEnabled: persistedSettings.soundEnabled,
    });
  }

  const legacyV2Raw = readStorageItem(STORAGE_KEYS.legacyGameV2);
  const legacyV2Parsed = parseVersionedValue<LegacyGameStateV2>(legacyV2Raw, STORAGE_KEYS.legacyGameV2);

  if (legacyV2Parsed?.data) {
    try {
      const migrated = migrateLegacyGameState(
        legacyV2Parsed.data,
        legacyV2Parsed.data.soundEnabled ?? persistedSettings.soundEnabled,
      );
      saveVersionedValue(STORAGE_KEYS.game, migrated, 3);
      saveVersionedValue(STORAGE_KEYS.settings, { soundEnabled: migrated.soundEnabled }, 2);
      pushHydrationWarning("Zaktualizowano zapis gry do nowego formatu danych.");
      return migrated;
    } catch (error) {
      if (legacyV2Raw) {
        backupStorageValue(STORAGE_KEYS.legacyGameV2, legacyV2Raw);
      }
      console.warn("[gameStore] Nie udało się zmigrować stanu gry v2.", error);
    }
  }

  const legacyV1Raw = readStorageItem(STORAGE_KEYS.legacyGameV1);
  const legacyV1Parsed = parseVersionedValue<LegacyGameStateV1>(legacyV1Raw, STORAGE_KEYS.legacyGameV1);
  const legacySettings = loadVersionedValue<SettingsPersistedState>(
    STORAGE_KEYS.legacySettings,
    { soundEnabled: persistedSettings.soundEnabled },
    1,
  );

  if (!legacyV1Parsed?.data) {
    return defaultState;
  }

  try {
    const migrated = migrateLegacyGameState(
      legacyV1Parsed.data,
      legacyV1Parsed.data.soundEnabled ?? legacySettings.soundEnabled,
    );
    saveVersionedValue(STORAGE_KEYS.game, migrated, 3);
    saveVersionedValue(STORAGE_KEYS.settings, { soundEnabled: migrated.soundEnabled }, 2);
    pushHydrationWarning("Zaktualizowano zapis gry do nowego formatu danych.");
    return migrated;
  } catch (error) {
    if (legacyV1Raw) {
      backupStorageValue(STORAGE_KEYS.legacyGameV1, legacyV1Raw);
    }
    console.warn("[gameStore] Nie udało się zmigrować starego stanu gry.", error);
    pushHydrationWarning("Nie udało się zmigrować starej gry. Utworzono backup i przywrócono nową rozgrywkę.");
    return defaultState;
  }
}

const initialGame = loadInitialGame();

function persistGame(game: GameState) {
  saveVersionedValue(STORAGE_KEYS.game, game, 3);
  saveVersionedValue(STORAGE_KEYS.settings, { soundEnabled: game.soundEnabled }, 2);
}

function canRemoveWithoutConfirmation(game: GameState, playerId: string) {
  return game.rounds.every((round) => getRoundScore(round, playerId) === 0);
}

function updateTimer(game: GameState, nextTimer: TimerState): GameState {
  return {
    ...game,
    timer: nextTimer,
    rounds: game.rounds.map((round) =>
      round.id === game.activeRoundId
        ? {
            ...round,
            durationSeconds: nextTimer.configuredDurationSeconds,
            finishCountdownSeconds: nextTimer.configuredFinishSeconds,
          }
        : round,
    ),
  };
}

function updateActiveRoundCategorySnapshot(game: GameState, categorySnapshot: CategorySnapshot[]) {
  return game.rounds.map((round) =>
    round.id === game.activeRoundId
      ? {
          ...round,
          categorySnapshot: [...categorySnapshot],
        }
      : round,
  );
}

function unconfirmPlayer(round: Round, playerId: string) {
  return {
    ...round,
    confirmedPlayerIds: round.confirmedPlayerIds.filter((id) => id !== playerId),
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: initialGame,
  setActiveRound: (roundId) =>
    set((state) => {
      const activeRound = getRoundById(state.game.rounds, roundId);
      return {
        game: {
          ...state.game,
          activeRoundId: roundId,
          currentDrawnLetter: activeRound?.letter ?? null,
        },
      };
    }),
  commitDrawnLetter: (letter) => {
    const { game } = get();
    const activeRound = getActiveRound(game);

    if (!activeRound) {
      return { ok: false, message: "Brak aktywnej rundy." };
    }

    if (activeRound.letter) {
      return { ok: false, message: "Ta runda ma już przypisaną literę." };
    }

    if (!getAvailableLetters(game).includes(letter)) {
      return { ok: false, message: "Ta litera nie jest dostępna w bieżącym alfabecie gry." };
    }

    set((state) => ({
      game: commitLetterSelection(state.game, letter),
    }));

    return { ok: true };
  },
  syncCategoryAvailability: (categories) =>
    set((state) => {
      const selectedCategoryIds = new Set(state.game.selectedCategories.map((category) => category.id));
      return {
        game: {
          ...state.game,
          categoryDrawSettings: clampDrawSettings(state.game.categoryDrawSettings, categories),
          lockedCategoryIds: state.game.lockedCategoryIds.filter((id) => selectedCategoryIds.has(id)),
        },
      };
    }),
  setDrawSetting: (difficulty, value, categories) =>
    set((state) => ({
      game: {
        ...state.game,
        categoryDrawSettings: clampDrawSettings(
          {
            ...state.game.categoryDrawSettings,
            [difficulty]: Math.max(0, value),
          },
          categories,
        ),
      },
    })),
  drawCategories: (categories) => {
    const { game } = get();
    const totalRequested = Object.values(game.categoryDrawSettings).reduce((sum, value) => sum + value, 0);

    if (totalRequested === 0) {
      return { ok: false, message: "Wybierz co najmniej jedną kategorię do losowania." };
    }

    try {
      const selectedCategories = game.selectedCategories.length
        ? rerollSelectedCategories(
            categories,
            game.categoryDrawSettings,
            game.selectedCategories,
            game.lockedCategoryIds,
          )
        : drawCategoriesBySettings(categories, game.categoryDrawSettings);

      set((state) => ({
        game: {
          ...state.game,
          selectedCategories,
          lockedCategoryIds: state.game.lockedCategoryIds.filter((id) =>
            selectedCategories.some((category) => category.id === id),
          ),
          rounds: updateActiveRoundCategorySnapshot(state.game, selectedCategories),
        },
      }));

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Nie udało się wylosować kategorii.",
      };
    }
  },
  rerollCategory: (categories, categoryId) => {
    const { game } = get();

    if (!game.selectedCategories.length) {
      return { ok: false, message: "Najpierw wylosuj zestaw kategorii." };
    }

    try {
      const selectedCategories = rerollCategoryWithinDifficulty(
        categories,
        game.selectedCategories,
        game.lockedCategoryIds,
        categoryId,
      );

      set((state) => ({
        game: {
          ...state.game,
          selectedCategories,
          rounds: updateActiveRoundCategorySnapshot(state.game, selectedCategories),
        },
      }));
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Nie udało się wymienić kategorii.",
      };
    }
  },
  rerollAllCategories: (categories) => get().drawCategories(categories),
  toggleCategoryLock: (categoryId) => {
    const { game } = get();

    if (hasGameStarted(game)) {
      return { ok: false, message: "Blokowanie kategorii jest dostępne tylko przed startem gry." };
    }

    if (!game.selectedCategories.some((category) => category.id === categoryId)) {
      return { ok: false, message: "Nie znaleziono tej kategorii w bieżącym zestawie." };
    }

    set((state) => ({
      game: {
        ...state.game,
        lockedCategoryIds: state.game.lockedCategoryIds.includes(categoryId)
          ? state.game.lockedCategoryIds.filter((id) => id !== categoryId)
          : [...state.game.lockedCategoryIds, categoryId],
      },
    }));

    return { ok: true };
  },
  updateAlphabet: (enabledLetters) => {
    const normalizedEnabledLetters = normalizeEnabledLettersList(enabledLetters);

    if (normalizedEnabledLetters.length < 2) {
      return { ok: false, message: "Wybierz co najmniej 2 litery." };
    }

    const nextAlphabet = normalizeAlphabetSettings({ enabledLetters: normalizedEnabledLetters });

    set((state) => ({
      game: {
        ...state.game,
        alphabetSettings: nextAlphabet,
      },
    }));

    return { ok: true };
  },
  addPlayer: (name) => {
    const { game } = get();

    if (game.players.length >= 10) {
      return { ok: false, message: "Możesz dodać maksymalnie 10 graczy." };
    }

    const nextName = name?.trim() || `Gracz ${game.players.length + 1}`;
    const validationError = validatePlayerName(nextName, game.players.map((player) => player.name));

    if (validationError) {
      return { ok: false, message: validationError };
    }

    const nextPlayer = createPlayer(game.players.length, nextName);
    nextPlayer.colorIndex = game.players.length % PLAYER_ACCENTS.length;

    set((state) => ({
      game: {
        ...state.game,
        players: [...state.game.players, nextPlayer],
        rounds: state.game.rounds.map((round) => ({
          ...round,
          scores: {
            ...round.scores,
            [nextPlayer.id]: createScoreEntry(),
          },
        })),
      },
    }));

    return { ok: true, playerId: nextPlayer.id };
  },
  updatePlayerName: (playerId, name) => {
    const { game } = get();
    const player = game.players.find((item) => item.id === playerId);

    if (!player) {
      return { ok: false, message: "Nie znaleziono gracza." };
    }

    const validationError = validatePlayerName(
      name,
      game.players.map((item) => item.name),
      player.name,
    );

    if (validationError) {
      return { ok: false, message: validationError };
    }

    const normalizedName = normalizeWhitespace(name);
    const changed = normalizedName !== player.name;

    if (!changed) {
      return { ok: true, changed: false };
    }

    set((state) => ({
      game: {
        ...state.game,
        players: state.game.players.map((item) =>
          item.id === playerId ? { ...item, name: normalizedName } : item,
        ),
      },
    }));

    return { ok: true, changed: true };
  },
  removePlayer: (playerId) => {
    const { game } = get();

    if (game.players.length <= 1) {
      return { ok: false, message: "W grze musi pozostać co najmniej 1 gracz." };
    }

    if (!canRemoveWithoutConfirmation(game, playerId)) {
      return { ok: false, needsConfirm: true, message: "Gracz ma zapisane punkty." };
    }

    get().forceRemovePlayer(playerId);
    return { ok: true };
  },
  forceRemovePlayer: (playerId) =>
    set((state) => ({
      game: {
        ...state.game,
        players: state.game.players.filter((player) => player.id !== playerId),
        rounds: state.game.rounds.map((round) => {
          const nextScores = { ...round.scores };
          delete nextScores[playerId];
          return {
            ...round,
            scores: nextScores,
            confirmedPlayerIds: round.confirmedPlayerIds.filter((id) => id !== playerId),
          };
        }),
      },
    })),
  movePlayer: (playerId, direction) =>
    set((state) => {
      const players = [...state.game.players];
      const index = players.findIndex((player) => player.id === playerId);

      if (index === -1) {
        return state;
      }

      const targetIndex = direction === "left" ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= players.length) {
        return state;
      }

      [players[index], players[targetIndex]] = [players[targetIndex], players[index]];

      return {
        game: {
          ...state.game,
          players,
        },
      };
    }),
  addScoreValue: (roundId, playerId, value) => {
    const { game } = get();

    if (game.status === "finished") {
      return { ok: false, message: "Gra została zakończona. Wyniki są zablokowane." };
    }

    if (![0, 5, 10, 15, 20, 25].includes(value)) {
      return { ok: false, message: "Nieobsługiwana wartość szybkiego punktowania." };
    }

    const round = getRoundById(game.rounds, roundId);
    const entry = round?.scores[playerId];

    if (!entry) {
      return { ok: false, message: "Nie znaleziono komórki punktowej." };
    }

    if (value === 0 && entry.total > 0) {
      return { ok: false, needsConfirm: true, message: "To działanie wyzeruje aktualny wynik." };
    }

    set((state) => ({
      game: {
        ...state.game,
        rounds: state.game.rounds.map((currentRound) =>
          currentRound.id === roundId
            ? {
                ...unconfirmPlayer(currentRound, playerId),
                scores: {
                  ...currentRound.scores,
                  [playerId]:
                    value === 0
                      ? clearScoreEntry()
                      : addScoreAddition(currentRound.scores[playerId] ?? createScoreEntry(), value),
                },
              }
            : currentRound,
        ),
      },
    }));

    return { ok: true };
  },
  undoLastScoreAddition: (roundId, playerId) => {
    const { game } = get();

    if (game.status === "finished") {
      return { ok: false, message: "Gra została zakończona. Wyniki są zablokowane." };
    }

    const round = getRoundById(game.rounds, roundId);
    const entry = round?.scores[playerId];

    if (!entry?.additions.length) {
      return { ok: false, message: "Brak punktów do cofnięcia." };
    }

    set((state) => ({
      game: {
        ...state.game,
        rounds: state.game.rounds.map((currentRound) =>
          currentRound.id === roundId
            ? {
                ...unconfirmPlayer(currentRound, playerId),
                scores: {
                  ...currentRound.scores,
                  [playerId]: undoLastScoreAddition(currentRound.scores[playerId]),
                },
              }
            : currentRound,
        ),
      },
    }));

    return { ok: true };
  },
  clearScore: (roundId, playerId) =>
    set((state) => ({
      game: {
        ...state.game,
        rounds: state.game.rounds.map((round) =>
          round.id === roundId
            ? {
                ...unconfirmPlayer(round, playerId),
                scores: {
                  ...round.scores,
                  [playerId]: clearScoreEntry(),
                },
              }
            : round,
        ),
      },
    })),
  toggleScoreConfirmed: (roundId, playerId) =>
    set((state) => ({
      game: {
        ...state.game,
        rounds: state.game.rounds.map((round) =>
          round.id === roundId
            ? {
                ...round,
                confirmedPlayerIds: round.confirmedPlayerIds.includes(playerId)
                  ? round.confirmedPlayerIds.filter((id) => id !== playerId)
                  : [...round.confirmedPlayerIds, playerId],
              }
            : round,
        ),
      },
    })),
  addRound: () => {
    const { game } = get();
    const activeRound = getActiveRound(game);

    if (!activeRound) {
      return { ok: false, message: "Brak aktywnej rundy." };
    }

    const readiness = isRoundReadyToAdvance(activeRound);

    if (!readiness.canAdvance) {
      return {
        ok: false,
        message: `Nie można dodać rundy bez ${readiness.missing.join(" i ")}.`,
      };
    }

    const nextRound = createRound(
      game.rounds.length + 1,
      game.players,
      game.timer,
      game.selectedCategories,
    );

    set((state) => ({
      game: {
        ...state.game,
        rounds: [
          ...state.game.rounds.map((round) =>
            round.id === state.game.activeRoundId
              ? {
                  ...round,
                  status: "finished" as const,
                  finishedAt: round.finishedAt ?? new Date().toISOString(),
                }
              : round,
          ),
          nextRound,
        ],
        activeRoundId: nextRound.id,
        currentDrawnLetter: null,
        timer: {
          ...state.game.timer,
          status: "idle",
          remainingSeconds: state.game.timer.configuredDurationSeconds,
          endsAt: null,
          pausedPhase: null,
        },
      },
    }));

    return { ok: true, roundNumber: nextRound.number, roundId: nextRound.id };
  },
  setTimerDuration: (seconds) =>
    set((state) => ({
      game: updateTimer(state.game, {
        ...state.game.timer,
        configuredDurationSeconds: Math.max(0, seconds),
        remainingSeconds:
          state.game.timer.status === "idle" || state.game.timer.status === "finished"
            ? Math.max(0, seconds)
            : state.game.timer.remainingSeconds,
      }),
    })),
  setFinishCountdown: (seconds) =>
    set((state) => ({
      game: updateTimer(state.game, {
        ...state.game.timer,
        configuredFinishSeconds: Math.max(1, seconds),
      }),
    })),
  startTimer: () => {
    const { game } = get();
    const activeRound = getActiveRound(game);

    if (!activeRound?.letter) {
      return { ok: false, message: "Najpierw wylosuj literę dla bieżącej rundy." };
    }

    if (game.timer.configuredDurationSeconds <= 0) {
      return { ok: false, message: "Ustaw czas rundy dłuższy niż 0 sekund." };
    }

    const endsAt = Date.now() + game.timer.configuredDurationSeconds * 1000;

    set((state) => ({
      game: {
        ...state.game,
        timer: {
          ...state.game.timer,
          status: "running",
          remainingSeconds: state.game.timer.configuredDurationSeconds,
          endsAt,
          pausedPhase: null,
        },
        rounds: state.game.rounds.map((round) =>
          round.id === state.game.activeRoundId ? { ...round, status: "running" } : round,
        ),
      },
    }));

    return { ok: true };
  },
  pauseTimer: () => {
    const { game } = get();
    const now = Date.now();

    if (game.timer.status !== "running" && game.timer.status !== "finishing") {
      return;
    }

    const remainingSeconds = game.timer.endsAt
      ? Math.max(0, Math.ceil((game.timer.endsAt - now) / 1000))
      : game.timer.remainingSeconds;

    set((state) => ({
      game: {
        ...state.game,
        timer: {
          ...state.game.timer,
          status: "paused",
          remainingSeconds,
          endsAt: null,
          pausedPhase: state.game.timer.status === "finishing" ? "finish" : "round",
        },
      },
    }));
  },
  resumeTimer: () => {
    const { game } = get();

    if (game.timer.status !== "paused") {
      return;
    }

    const nextStatus = game.timer.pausedPhase === "finish" ? "finishing" : "running";

    set((state) => ({
      game: {
        ...state.game,
        timer: {
          ...state.game.timer,
          status: nextStatus,
          endsAt: Date.now() + state.game.timer.remainingSeconds * 1000,
        },
      },
    }));
  },
  resetTimer: () =>
    set((state) => ({
      game: {
        ...state.game,
        timer: {
          ...state.game.timer,
          status: "idle",
          remainingSeconds: state.game.timer.configuredDurationSeconds,
          endsAt: null,
          pausedPhase: null,
        },
      },
    })),
  triggerFinishCountdown: () => {
    const { game } = get();

    if (game.timer.status !== "running") {
      return {
        ok: false,
        message: "Końcowe odliczanie można uruchomić tylko podczas aktywnej rundy.",
      };
    }

    set((state) => ({
      game: {
        ...state.game,
        timer: {
          ...state.game.timer,
          status: "finishing",
          remainingSeconds: state.game.timer.configuredFinishSeconds,
          endsAt: Date.now() + state.game.timer.configuredFinishSeconds * 1000,
          pausedPhase: null,
        },
      },
    }));

    return { ok: true };
  },
  completeTimer: () =>
    set((state) => ({
      game: {
        ...state.game,
        timer: {
          ...state.game.timer,
          status: "finished",
          remainingSeconds: 0,
          endsAt: null,
          pausedPhase: null,
        },
        rounds: state.game.rounds.map((round) =>
          round.id === state.game.activeRoundId
            ? {
                ...round,
                status: "finished",
                finishedAt: round.finishedAt ?? new Date().toISOString(),
              }
            : round,
        ),
      },
    })),
  toggleSound: () =>
    set((state) => ({
      game: {
        ...state.game,
        soundEnabled: !state.game.soundEnabled,
      },
    })),
  endGame: () =>
    set((state) => ({
      game: {
        ...state.game,
        status: "finished",
        finishedAt: new Date().toISOString(),
        timer: {
          ...state.game.timer,
          status: "finished",
          endsAt: null,
          remainingSeconds: 0,
          pausedPhase: null,
        },
      },
    })),
  newGame: (options) =>
    set((state) => {
      const preservedPlayers = options?.preservePlayers
        ? state.game.players.map((player, index) => ({
            ...player,
            colorIndex: index % PLAYER_ACCENTS.length,
          }))
        : undefined;
      const nextGame = createDefaultGameState(preservedPlayers);

      return {
        game: {
          ...nextGame,
          soundEnabled: state.game.soundEnabled,
          alphabetSettings: state.game.alphabetSettings,
        },
      };
    }),
  getRoundScore: (roundId, playerId) => {
    const round = getRoundById(get().game.rounds, roundId);
    return getRoundScore(round, playerId);
  },
  getPlayerTotal: (playerId) => getPlayerTotal(get().game, playerId),
  getRanking: () => getRanking(get().game),
}));

useGameStore.subscribe((state) => {
  persistGame(state.game);
});
