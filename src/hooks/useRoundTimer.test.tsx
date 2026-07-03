import { act, renderHook } from "@testing-library/react";
import { useGameStore } from "@/features/game/gameStore";
import { createDefaultGameState } from "@/features/game/gameUtils";
import { useRoundTimer } from "@/hooks/useRoundTimer";
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

describe("useRoundTimer audio", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    const state = createDefaultGameState();
    useGameStore.setState({
      ...useGameStore.getState(),
      game: state,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("odtwarza tick raz na sekundę w ostatnich 15 sekundach", () => {
    const playCountdownTick = vi.mocked(gameAudio.playCountdownTick);
    const now = Date.now();
    const state = createDefaultGameState();
    state.timer = {
      ...state.timer,
      status: "running",
      endsAt: now + 15_000,
      remainingSeconds: 15,
    };

    vi.setSystemTime(now);
    useGameStore.setState({ ...useGameStore.getState(), game: state });

    renderHook(() => useRoundTimer());

    expect(playCountdownTick).toHaveBeenCalledWith(15);

    act(() => {
      vi.setSystemTime(now + 500);
      vi.advanceTimersByTime(500);
    });

    expect(playCountdownTick.mock.calls.length).toBeLessThanOrEqual(2);

    act(() => {
      vi.setSystemTime(now + 1_050);
      vi.advanceTimersByTime(600);
    });

    expect(playCountdownTick).toHaveBeenLastCalledWith(14);
  });

  it("pauza nie odtwarza dźwięku, a soundEnabled=false blokuje efekty", () => {
    const pausedState = createDefaultGameState();
    pausedState.soundEnabled = false;
    pausedState.timer = {
      ...pausedState.timer,
      status: "paused",
      remainingSeconds: 14,
    };

    useGameStore.setState({ ...useGameStore.getState(), game: pausedState });

    renderHook(() => useRoundTimer());

    expect(gameAudio.playCountdownTick).not.toHaveBeenCalled();
  });

  it("zero uruchamia osobny efekt zakończenia", () => {
    const runningState = createDefaultGameState();
    runningState.timer = {
      ...runningState.timer,
      status: "running",
      endsAt: Date.now() + 4_000,
      remainingSeconds: 4,
    };

    useGameStore.setState({ ...useGameStore.getState(), game: runningState });

    renderHook(() => useRoundTimer());

    act(() => {
      useGameStore.setState({
        ...useGameStore.getState(),
        game: {
          ...useGameStore.getState().game,
          timer: {
            ...useGameStore.getState().game.timer,
            status: "finished",
            remainingSeconds: 0,
            endsAt: null,
          },
        },
      });
    });

    expect(gameAudio.playRoundEnd).toHaveBeenCalledTimes(1);
  });
});
