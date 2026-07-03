import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CategoryItem } from "@/features/categories/components/CategoryItem";
import { DEFAULT_CATEGORIES } from "@/features/categories/defaultCategories";
import { useGameStore } from "@/features/game/gameStore";
import { GameSummary } from "@/features/game/components/GameSummary";
import { LetterWheel } from "@/features/game/components/LetterWheel";
import { PlayerScoreTable } from "@/features/game/components/PlayerScoreTable";
import {
  createDefaultGameState,
  DEFAULT_ALPHABET_LETTERS,
  drawCategoriesBySettings,
  drawRandomLetter,
  getAvailableLetters,
  getRanking,
  reconcileTimerState,
} from "@/features/game/gameUtils";
import type { RankingEntry } from "@/features/game/gameTypes";
import { GamePage } from "@/pages/GamePage";
import { GamePlayPage } from "@/pages/GamePlayPage";
import { STORAGE_KEYS } from "@/lib/storage";
import { gameAudio } from "@/lib/audio";

vi.mock("@/lib/audio", () => ({
  gameAudio: {
    startWheelSpin: vi.fn(),
    stopWheelSpin: vi.fn(),
    confirmWheelResult: vi.fn(),
    playCountdownTick: vi.fn(),
    playRoundEnd: vi.fn(),
    playVictory: vi.fn(),
  },
}));

describe("game v3", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useGameStore.setState({
      ...useGameStore.getState(),
      game: createDefaultGameState(),
    });
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("losuje literę wyłącznie z dostępnej puli", () => {
    const letters = ["A", "Ł", "Ż"];

    for (let index = 0; index < 40; index += 1) {
      expect(letters).toContain(drawRandomLetter(letters));
    }
  });

  it("po zakończeniu losowania litera zapisuje się automatycznie w rundzie i znika z puli", () => {
    const { result } = renderHook(() => useGameStore());
    const letter = getAvailableLetters(result.current.game)[0]!;

    act(() => {
      result.current.commitDrawnLetter(letter);
    });

    expect(result.current.game.rounds[0]?.letter).toBe(letter);
    expect(result.current.game.usedLetters).toContain(letter);
    expect(getAvailableLetters(result.current.game)).not.toContain(letter);
  });

  it("tej samej litery nie można użyć ponownie, a dodanie rundy nie przywraca puli", () => {
    const { result } = renderHook(() => useGameStore());
    const letter = getAvailableLetters(result.current.game)[0]!;

    act(() => {
      result.current.commitDrawnLetter(letter);
    });

    expect(result.current.commitDrawnLetter(letter).ok).toBe(false);

    act(() => {
      result.current.drawCategories(DEFAULT_CATEGORIES);
      result.current.addRound();
    });

    expect(getAvailableLetters(result.current.game)).not.toContain(letter);
    expect(result.current.game.usedLetters).toContain(letter);
  });

  it("nowa gra przywraca pełną pulę liter i resetuje wspólne kategorie", () => {
    const { result } = renderHook(() => useGameStore());
    const letter = getAvailableLetters(result.current.game)[0]!;

    act(() => {
      result.current.commitDrawnLetter(letter);
      result.current.drawCategories(DEFAULT_CATEGORIES);
      result.current.newGame({ preservePlayers: true });
    });

    expect(getAvailableLetters(result.current.game)).toEqual([...DEFAULT_ALPHABET_LETTERS]);
    expect(result.current.game.usedLetters).toEqual([]);
    expect(result.current.game.selectedCategories).toEqual([]);
  });

  it("nie pokazuje już ręcznego przycisku zapisywania litery", () => {
    render(
      <LetterWheel
        availableLetters={["A", "B", "C"]}
        currentLetter={null}
        soundEnabled
        usedLetters={[]}
        onDrawResolved={() => undefined}
      />,
    );

    expect(screen.queryByRole("button", { name: /zapisz literę/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /reset liter/i })).not.toBeInTheDocument();
  });

  it("kategorie są losowane raz dla całej gry i pozostają po dodaniu rundy", () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.drawCategories(DEFAULT_CATEGORIES);
    });

    const firstSelection = result.current.game.selectedCategories.map((category) => category.id);

    act(() => {
      result.current.commitDrawnLetter("A");
      result.current.addRound();
    });

    expect(result.current.game.selectedCategories.map((category) => category.id)).toEqual(firstSelection);
    expect(result.current.game.rounds[1]?.categorySnapshot.map((category) => category.id)).toEqual(firstSelection);
  });

  it("losuje prawidłową liczbę kategorii bez duplikatów", () => {
    const result = drawCategoriesBySettings(DEFAULT_CATEGORIES, {
      basic: 1,
      classic: 1,
      medium: 2,
      hard: 1,
      advanced: 1,
    });

    expect(result).toHaveLength(6);
    expect(new Set(result.map((category) => category.id)).size).toBe(result.length);
    expect(result.filter((category) => category.difficulty === "medium")).toHaveLength(2);
  });

  it("kliknięcie 20 trzy razy i 5 raz daje 65, a cofnięcie usuwa ostatnią wartość", () => {
    const { result } = renderHook(() => useGameStore());
    const playerId = result.current.game.players[0]!.id;
    const roundId = result.current.game.rounds[0]!.id;

    act(() => {
      result.current.addScoreValue(roundId, playerId, 20);
      result.current.addScoreValue(roundId, playerId, 20);
      result.current.addScoreValue(roundId, playerId, 20);
      result.current.addScoreValue(roundId, playerId, 5);
    });

    expect(result.current.getRoundScore(roundId, playerId)).toBe(65);

    act(() => {
      result.current.undoLastScoreAddition(roundId, playerId);
    });

    expect(result.current.getRoundScore(roundId, playerId)).toBe(60);
  });

  it("wyczyszczenie ustawia wynik na zero, a łączny wynik jest dalej liczony do rankingu", () => {
    const { result } = renderHook(() => useGameStore());
    const playerId = result.current.game.players[0]!.id;
    const roundId = result.current.game.rounds[0]!.id;

    act(() => {
      result.current.addScoreValue(roundId, playerId, 25);
      result.current.addScoreValue(roundId, playerId, 20);
      result.current.clearScore(roundId, playerId);
      result.current.addScoreValue(roundId, playerId, 15);
    });

    expect(result.current.getRoundScore(roundId, playerId)).toBe(15);
    expect(result.current.getPlayerTotal(playerId)).toBe(15);
  });

  it("zmiana nazwy gracza aktualizuje tabelę, ranking, podium i inicjał avatara", () => {
    const state = createDefaultGameState();
    const playerId = state.players[0]!.id;

    useGameStore.setState({
      ...useGameStore.getState(),
      game: state,
    });

    act(() => {
      useGameStore.getState().updatePlayerName(playerId, "Tymoteusz");
      useGameStore.getState().addScoreValue(state.rounds[0]!.id, playerId, 15);
    });

    const currentGame = useGameStore.getState().game;
    const ranking = getRanking(currentGame);

    const { rerender } = render(
      <PlayerScoreTable
        locked={false}
        players={currentGame.players}
        rounds={currentGame.rounds}
        onAddPlayer={() => undefined}
        onAddScoreValue={() => undefined}
        onClearScore={() => undefined}
        onMovePlayer={() => undefined}
        onRemovePlayer={() => undefined}
        onRenamePlayer={() => undefined}
        onUndoScore={() => undefined}
      />,
    );

    expect(screen.getAllByText("Tymoteusz").length).toBeGreaterThan(0);
    expect(screen.queryByText("Gracz 1")).not.toBeInTheDocument();
    expect(screen.getAllByText("T").length).toBeGreaterThan(0);

    rerender(
      <GameSummary
        categories={[]}
        ranking={ranking}
        rounds={currentGame.rounds}
        soundEnabled={false}
        usedLetters={[]}
        onNewGame={() => undefined}
        onReturn={() => undefined}
      />,
    );

    expect(screen.getAllByText("Tymoteusz").length).toBeGreaterThan(0);
  });

  it("blokuje duplikat nazwy gracza", () => {
    const { result } = renderHook(() => useGameStore());
    const secondPlayerId = result.current.game.players[1]!.id;

    const updateResult = result.current.updatePlayerName(secondPlayerId, "Gracz 1");

    expect(updateResult.ok).toBe(false);
    expect(updateResult.message).toBe("Gracz o tej nazwie już istnieje.");
  });

  it("nie pokazuje wiersza sumy w tabeli, ale zachowuje szybkie wartości 0-25", () => {
    const game = createDefaultGameState();

    render(
      <PlayerScoreTable
        locked={false}
        players={game.players}
        rounds={game.rounds}
        onAddPlayer={() => undefined}
        onAddScoreValue={() => undefined}
        onClearScore={() => undefined}
        onMovePlayer={() => undefined}
        onRemovePlayer={() => undefined}
        onRenamePlayer={() => undefined}
        onUndoScore={() => undefined}
      />,
    );

    expect(screen.queryByText("Suma")).not.toBeInTheDocument();
    [0, 5, 10, 15, 20, 25].forEach((value) => {
      expect(screen.getAllByRole("button", { name: String(value) }).length).toBeGreaterThan(0);
    });
  });

  it("ranking poprawnie obsługuje miejsca i remisy", () => {
    const game = createDefaultGameState();
    const [playerA, playerB] = game.players;
    game.rounds[0]!.scores[playerA!.id] = { total: 30, additions: [15, 15] };
    game.rounds[0]!.scores[playerB!.id] = { total: 30, additions: [20, 10] };

    const ranking = getRanking(game);

    expect(ranking[0]?.place).toBe(1);
    expect(ranking[1]?.place).toBe(1);
    expect(ranking[0]?.isTied).toBe(true);
  });

  it("podium renderuje się dla jednego, dwóch i wielu graczy", () => {
    const onePlayerRanking: RankingEntry[] = [
      { playerId: "1", playerName: "Ala", colorIndex: 0, total: 50, place: 1, isTied: false },
    ];
    const twoPlayerRanking: RankingEntry[] = [
      { playerId: "1", playerName: "Ala", colorIndex: 0, total: 50, place: 1, isTied: false },
      { playerId: "2", playerName: "Bartek", colorIndex: 1, total: 40, place: 2, isTied: false },
    ];

    const { rerender } = render(
      <GameSummary
        categories={[]}
        ranking={onePlayerRanking}
        rounds={[]}
        soundEnabled={false}
        usedLetters={[]}
        onNewGame={() => undefined}
        onReturn={() => undefined}
      />,
    );

    expect(screen.getByText("Ala")).toBeInTheDocument();

    rerender(
      <GameSummary
        categories={[]}
        ranking={twoPlayerRanking}
        rounds={[]}
        soundEnabled={false}
        usedLetters={[]}
        onNewGame={() => undefined}
        onReturn={() => undefined}
      />,
    );

    expect(screen.getByText(/2\. miejsce/i)).toBeInTheDocument();
  });

  it("koło uruchamia dźwięki spin i potwierdzenia", async () => {
    vi.useFakeTimers();
    const onDrawResolved = vi.fn();

    render(
      <LetterWheel
        availableLetters={["A", "B", "C", "D"]}
        currentLetter={null}
        soundEnabled
        usedLetters={[]}
        onDrawResolved={onDrawResolved}
      />,
    );

    act(() => {
      screen.getByRole("button", { name: /losuj literę/i }).click();
      vi.advanceTimersByTime(2500);
    });

    expect(gameAudio.startWheelSpin).toHaveBeenCalled();
    expect(gameAudio.confirmWheelResult).toHaveBeenCalled();
    expect(onDrawResolved).toHaveBeenCalledTimes(1);
  });

  it("konfiguracja alfabetu wpływa na pulę, nie przywraca użytych liter i zapisuje się w localStorage", () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.updateAlphabet(["A", "B", "Ó"]);
      result.current.commitDrawnLetter("A");
      result.current.updateAlphabet(["A", "B", "Ó", "Ż"]);
    });

    expect(getAvailableLetters(result.current.game)).toEqual(["B", "Ż", "Ó"]);

    const stored = window.localStorage.getItem(STORAGE_KEYS.game);
    expect(stored).toContain("alphabetSettings");
    expect(stored).toContain("Ó");
  });

  it("nie pozwala zapisać zbyt małego alfabetu i koło używa tylko aktywnych liter", () => {
    const { result } = renderHook(() => useGameStore());

    expect(result.current.updateAlphabet(["A"]).ok).toBe(false);

    act(() => {
      result.current.updateAlphabet(["A", "B", "Ó"]);
    });

    expect(getAvailableLetters(useGameStore.getState().game)).toEqual(["A", "B", "Ó"]);

    render(
      <LetterWheel
        availableLetters={getAvailableLetters(useGameStore.getState().game)}
        currentLetter={null}
        soundEnabled={false}
        usedLetters={[]}
        onDrawResolved={() => undefined}
      />,
    );

    expect(screen.getAllByText("Ó").length).toBeGreaterThan(0);
  });

  it("górny i dolny przycisk dodają rundę, a przycisk losowania kategorii nie jest zdublowany", async () => {
    const user = userEvent.setup();
    const game = createDefaultGameState();
    game.rounds[0]!.letter = "A";
    game.currentDrawnLetter = "A";

    useGameStore.setState({
      ...useGameStore.getState(),
      game,
    });

    const { unmount } = render(
      <MemoryRouter>
        <GamePage />
      </MemoryRouter>,
    );

    const addButtons = screen.getAllByRole("button", { name: "Dodaj rundę" });
    expect(addButtons).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Losuj kategorie" })).toHaveLength(1);

    await user.click(addButtons[0]!);
    expect(useGameStore.getState().game.rounds).toHaveLength(2);

    unmount();

    const freshGame = createDefaultGameState();
    freshGame.rounds[0]!.letter = "B";
    freshGame.currentDrawnLetter = "B";
    useGameStore.setState({
      ...useGameStore.getState(),
      game: freshGame,
    });

    render(
      <MemoryRouter>
        <GamePage />
      </MemoryRouter>,
    );

    await user.click(screen.getAllByRole("button", { name: "Dodaj rundę" })[1]!);
    expect(useGameStore.getState().game.rounds).toHaveLength(2);
  });

  it("tryb gry korzysta z tego samego stanu i pokazuje punktację po zakończeniu czasu", () => {
    const game = createDefaultGameState();
    game.players[0]!.name = "Tymoteusz";
    game.rounds[0]!.letter = "T";
    game.currentDrawnLetter = "T";
    game.selectedCategories = DEFAULT_CATEGORIES.slice(0, 2).map((category) => ({
      id: category.id,
      name: category.name,
      difficulty: category.difficulty,
      description: category.description,
      examples: category.examples,
    }));
    game.rounds[0]!.categorySnapshot = [...game.selectedCategories];
    game.timer.status = "finished";
    game.timer.remainingSeconds = 0;
    game.rounds[0]!.status = "finished";

    useGameStore.setState({
      ...useGameStore.getState(),
      game,
    });

    render(
      <MemoryRouter>
        <GamePlayPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Punktacja rundy")).toBeInTheDocument();
    expect(screen.getAllByText("Tymoteusz").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /dodaj kolejną rundę/i })).toBeInTheDocument();
  });

  it("przywraca timer po odświeżeniu strony", () => {
    const now = Date.now();
    const timer = reconcileTimerState(
      {
        status: "running",
        configuredDurationSeconds: 60,
        configuredFinishSeconds: 15,
        remainingSeconds: 60,
        endsAt: now + 34_000,
        pausedPhase: null,
      },
      now + 10_000,
    );

    expect(timer.status).toBe("running");
    expect(timer.remainingSeconds).toBe(24);
  });

  it("menu działań kategorii otwiera się po kliknięciu i zamyka po Escape lub kliknięciu poza", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button type="button">Poza</button>
        <CategoryItem
          category={DEFAULT_CATEGORIES[0]!}
          onDelete={() => undefined}
          onEdit={() => undefined}
          onToggle={() => undefined}
        />
      </div>,
    );

    await user.click(screen.getByRole("button", { name: /otwórz menu działań/i }));
    expect(screen.getByTestId("category-actions-menu")).toBeInTheDocument();
    expect(screen.getByText("Edytuj")).toBeInTheDocument();
    expect(screen.getByText(/Wyłącz|Włącz/)).toBeInTheDocument();
    expect(screen.getByText("Usuń")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("category-actions-menu")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /otwórz menu działań/i }));
    await user.click(screen.getByRole("button", { name: "Poza" }));
    expect(screen.queryByTestId("category-actions-menu")).not.toBeInTheDocument();
  });
});
