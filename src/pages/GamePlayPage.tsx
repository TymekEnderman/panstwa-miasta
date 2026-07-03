import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Expand,
  Pause,
  Play,
  Power,
  RotateCcw,
  TimerReset,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Card } from "@/components/ui/Card";
import { showToast } from "@/components/ui/toastStore";
import { CategoryInfoPopover } from "@/features/categories/components/CategoryInfoPopover";
import { QuickScoreCard } from "@/features/game/components/QuickScoreCard";
import { LetterWheel } from "@/features/game/components/LetterWheel";
import { useGameStore } from "@/features/game/gameStore";
import { useRoundTimer } from "@/hooks/useRoundTimer";
import { cx } from "@/lib/cx";
import {
  getActiveRound,
  getAvailableLetters,
  getPlayStage,
} from "@/features/game/gameUtils";

export function GamePlayPage() {
  const game = useGameStore((state) => state.game);
  const commitDrawnLetter = useGameStore((state) => state.commitDrawnLetter);
  const addScoreValue = useGameStore((state) => state.addScoreValue);
  const clearScore = useGameStore((state) => state.clearScore);
  const undoScore = useGameStore((state) => state.undoLastScoreAddition);
  const toggleScoreConfirmed = useGameStore((state) => state.toggleScoreConfirmed);
  const addRound = useGameStore((state) => state.addRound);
  const startTimer = useGameStore((state) => state.startTimer);
  const pauseTimer = useGameStore((state) => state.pauseTimer);
  const resumeTimer = useGameStore((state) => state.resumeTimer);
  const resetTimer = useGameStore((state) => state.resetTimer);
  const triggerFinishCountdown = useGameStore((state) => state.triggerFinishCountdown);
  const toggleSound = useGameStore((state) => state.toggleSound);
  const endGame = useGameStore((state) => state.endGame);
  const activeRound = useMemo(() => getActiveRound(game), [game]);
  const availableLetters = useMemo(() => getAvailableLetters(game), [game]);
  const [spinRequest, setSpinRequest] = useState(0);
  const [isLetterDrawing, setIsLetterDrawing] = useState(false);
  const [showScoringSurface, setShowScoringSurface] = useState(false);
  const [endGameOpen, setEndGameOpen] = useState(false);
  const [fullscreenEnabled, setFullscreenEnabled] = useState(false);
  const { formattedTime, displayRemainingSeconds } = useRoundTimer();

  useEffect(() => {
    setFullscreenEnabled(typeof document !== "undefined" && Boolean(document.fullscreenEnabled));
  }, []);

  useEffect(() => {
    if (game.timer.status === "finished") {
      setShowScoringSurface(true);
      return;
    }

    setShowScoringSurface(false);
  }, [game.activeRoundId, game.timer.status]);

  const playStage = getPlayStage(game, { isLetterDrawing });
  const categories = game.selectedCategories;
  const allPlayersConfirmed = activeRound
    ? game.players.every((player) => activeRound.confirmedPlayerIds.includes(player.id))
    : false;
  const isScoringStage = playStage === "scoring" || playStage === "round-complete";
  const showRoundSurface = !showScoringSurface;

  const runAddRound = () => {
    if (playStage === "scoring" && !allPlayersConfirmed) {
      showToast({
        title: "Nie wszyscy gracze mają oznaczoną punktację",
        description: "Dodajemy kolejną rundę mimo braku pełnego potwierdzenia.",
        tone: "warning",
      });
    }

    const result = addRound();

    if (!result.ok) {
      showToast({
        title: "Nie można dodać rundy",
        description: result.message,
        tone: "warning",
      });
      return;
    }

    setShowScoringSurface(false);
    showToast({
      title: `Dodano rundę ${result.roundNumber}.`,
      tone: "success",
    });
  };

  const handleFullscreen = async () => {
    if (!fullscreenEnabled) {
      return;
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      showToast({
        title: "Nie udało się przełączyć pełnego ekranu",
        tone: "warning",
      });
    }
  };

  return (
    <main className="app-shell pb-28">
      <div className="page-frame space-y-6">
        <header className="glass-card p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Tryb gry
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
                Runda {activeRound?.number ?? 1}
              </h1>
              <p className="mt-1 text-sm text-muted">
                Litera, timer, kategorie i szybka punktacja w jednym widoku.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="inline-flex items-center justify-center rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                {game.players.length} graczy
              </div>
              <Button size="lg" variant="secondary" onClick={toggleSound}>
                {game.soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                Dźwięk: {game.soundEnabled ? "włączony" : "wyłączony"}
              </Button>
              {fullscreenEnabled ? (
                <Button size="lg" variant="secondary" onClick={() => void handleFullscreen()}>
                  <Expand className="h-5 w-5" />
                  Pełny ekran
                </Button>
              ) : null}
              <Link to="/game">
                <Button className="w-full sm:w-auto" size="lg" variant="primary">
                  <ArrowLeft className="h-5 w-5" />
                  Wróć do panelu
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {showRoundSurface ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)_minmax(320px,0.9fr)]">
            <Card
              className="min-h-[520px]"
              subtitle={
                playStage === "prepare"
                  ? "Najpierw losujemy literę dla tej rundy."
                  : "Litera jest wspólna dla wszystkich graczy w tej rundzie."
              }
              title="Litera rundy"
            >
              {playStage === "prepare" || playStage === "letter-draw" ? (
                <LetterWheel
                  availableLetters={availableLetters}
                  currentLetter={activeRound?.letter ?? game.currentDrawnLetter}
                  drawDisabled={Boolean(activeRound?.letter) || !availableLetters.length}
                  soundEnabled={game.soundEnabled}
                  spinRequest={spinRequest}
                  usedLetters={game.usedLetters}
                  onDrawResolved={(letter) => {
                    const result = commitDrawnLetter(letter);
                    setIsLetterDrawing(false);

                    if (!result.ok) {
                      showToast({
                        title: "Nie udało się zapisać litery",
                        description: result.message,
                        tone: "warning",
                      });
                      return;
                    }

                    showToast({
                      title: `Wylosowano literę ${letter}.`,
                      tone: "success",
                    });
                  }}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center rounded-[32px] border border-line bg-slate-50 px-6 py-10 text-center">
                  <div className="text-sm font-semibold uppercase tracking-[0.24em] text-muted">
                    Litera tej rundy
                  </div>
                  <div className="mt-6 text-[clamp(6rem,16vw,10rem)] font-semibold leading-none text-ink">
                    {activeRound?.letter ?? "?"}
                  </div>
                  <div className="mt-5 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                    Litera zapisana dla rundy {activeRound?.number ?? 1}
                  </div>
                </div>
              )}

              {!activeRound?.letter && playStage !== "letter-draw" ? (
                <div className="mt-5">
                  <Button
                    disabled={!availableLetters.length}
                    fullWidth
                    size="lg"
                    variant="primary"
                    onClick={() => {
                      setIsLetterDrawing(true);
                      setSpinRequest((value) => value + 1);
                    }}
                  >
                    Losuj literę
                  </Button>
                </div>
              ) : null}
            </Card>

            <Card
              className="min-h-[520px]"
              headerAction={
                <div
                  className={cx(
                    "rounded-full px-3 py-1 text-sm font-semibold",
                    playStage === "finishing"
                      ? "bg-amber-100 text-amber-800"
                      : displayRemainingSeconds <= 5 && game.timer.status !== "finished"
                        ? "bg-rose-100 text-rose-700"
                        : game.timer.status === "running"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-700",
                  )}
                >
                  {playStage === "finishing"
                    ? "Końcowe odliczanie"
                    : game.timer.status === "running"
                      ? "Trwa runda"
                      : game.timer.status === "paused"
                        ? "Pauza"
                        : game.timer.status === "finished"
                          ? "Koniec rundy"
                          : "Gotowy"}
                </div>
              }
              title="Timer"
            >
              <div
                className={cx(
                  "rounded-[32px] border px-6 py-10 text-center",
                  playStage === "finishing"
                    ? "border-amber-200 bg-amber-50"
                    : displayRemainingSeconds <= 5 && game.timer.status !== "finished"
                      ? "border-rose-200 bg-rose-50"
                      : "border-line bg-slate-50",
                )}
              >
                <div className="text-[clamp(4rem,11vw,7rem)] font-semibold leading-none tracking-tight text-ink">
                  {formattedTime}
                </div>
                <div className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                  min : sek
                </div>
                {playStage === "finishing" ? (
                  <div className="mt-5 text-base font-semibold text-amber-800">Końcowe odliczanie</div>
                ) : null}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {game.timer.status === "idle" || game.timer.status === "finished" ? (
                  <Button
                    fullWidth
                    size="lg"
                    variant="primary"
                    onClick={() => {
                      const result = startTimer();
                      if (!result.ok) {
                        showToast({
                          title: "Nie udało się uruchomić timera",
                          description: result.message,
                          tone: "warning",
                        });
                      }
                    }}
                  >
                    <Play className="h-5 w-5" />
                    Start
                  </Button>
                ) : game.timer.status === "paused" ? (
                  <Button fullWidth size="lg" variant="primary" onClick={resumeTimer}>
                    <Play className="h-5 w-5" />
                    Wznów
                  </Button>
                ) : (
                  <Button fullWidth size="lg" variant="secondary" onClick={pauseTimer}>
                    <Pause className="h-5 w-5" />
                    Pauza
                  </Button>
                )}

                <Button fullWidth size="lg" variant="secondary" onClick={resetTimer}>
                  <RotateCcw className="h-5 w-5" />
                  Reset
                </Button>

                <Button
                  className="sm:col-span-2"
                  disabled={game.timer.status !== "running"}
                  fullWidth
                  size="lg"
                  variant="danger"
                  onClick={() => {
                    const result = triggerFinishCountdown();
                    if (!result.ok) {
                      showToast({
                        title: "Nie udało się uruchomić końcowego odliczania",
                        description: result.message,
                        tone: "warning",
                      });
                    }
                  }}
                >
                  <TimerReset className="h-5 w-5" />
                  Ktoś skończył
                </Button>
              </div>
            </Card>

            <Card
              className="min-h-[520px]"
              subtitle="To tylko aktywne kategorie tej rozgrywki. Ich konfiguracja pozostaje w panelu gry."
              title="Kategorie tej gry"
            >
              <div className="grid gap-3">
                {categories.length ? (
                  categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between rounded-3xl border border-line bg-slate-50 px-4 py-4"
                    >
                      <div>
                        <div className="font-semibold text-ink">{category.name}</div>
                        <div className="mt-1 text-sm text-muted">{category.difficulty}</div>
                      </div>
                      <CategoryInfoPopover category={category} />
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-line bg-slate-50 px-4 py-5 text-sm text-muted">
                    Najpierw wylosuj kategorie w panelu gry, a potem wróć tutaj do prowadzenia rundy.
                  </div>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <Card
            subtitle="Punkty wpisujesz bez wracania do pełnego panelu. Po oznaczeniu wszystkich kart łatwiej przejść do kolejnej rundy."
            title="Punktacja rundy"
          >
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-line bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                Runda {activeRound?.number ?? 1}
              </div>
              <div className="rounded-full border border-line bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                Litera: {activeRound?.letter ?? "brak"}
              </div>
              <div
                className={cx(
                  "rounded-full px-4 py-2 text-sm font-semibold",
                  allPlayersConfirmed
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border border-amber-200 bg-amber-50 text-amber-800",
                )}
              >
                {allPlayersConfirmed ? "Punkty wpisane dla wszystkich" : "Część graczy czeka na potwierdzenie"}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {game.players.map((player) => (
                <QuickScoreCard
                  key={player.id}
                  confirmed={activeRound?.confirmedPlayerIds.includes(player.id)}
                  entry={activeRound?.scores[player.id]}
                  layout="play"
                  player={player}
                  onAddValue={(value) => {
                    const result = addScoreValue(activeRound!.id, player.id, value);

                    if (result.needsConfirm) {
                      clearScore(activeRound!.id, player.id);
                      showToast({
                        title: "Wyzerowano wynik rundy",
                        tone: "success",
                      });
                      return;
                    }

                    if (!result.ok) {
                      showToast({
                        title: "Nie udało się zmienić punktów",
                        description: result.message,
                        tone: "warning",
                      });
                    }
                  }}
                  onClear={() => {
                    clearScore(activeRound!.id, player.id);
                    showToast({
                      title: "Wynik rundy został wyczyszczony",
                      tone: "success",
                    });
                  }}
                  onToggleConfirmed={() => toggleScoreConfirmed(activeRound!.id, player.id)}
                  onUndo={() => {
                    const result = undoScore(activeRound!.id, player.id);

                    if (!result.ok) {
                      showToast({
                        title: "Nie udało się cofnąć punktów",
                        description: result.message,
                        tone: "warning",
                      });
                    }
                  }}
                />
              ))}
            </div>
          </Card>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 py-3 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm">
        <div className="page-frame flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
          {isScoringStage ? (
            <>
              {showScoringSurface ? (
                <Button fullWidth size="lg" variant="secondary" onClick={() => setShowScoringSurface(false)}>
                  Wróć do rundy
                </Button>
              ) : (
                <Button fullWidth size="lg" variant="secondary" onClick={() => setShowScoringSurface(true)}>
                  Pokaż punktację
                </Button>
              )}
              <Button fullWidth size="lg" variant="primary" onClick={runAddRound}>
                <CheckCircle2 className="h-5 w-5" />
                Dodaj kolejną rundę
              </Button>
              <Button fullWidth size="lg" variant="danger" onClick={() => setEndGameOpen(true)}>
                <Power className="h-5 w-5" />
                Zakończ grę
              </Button>
            </>
          ) : playStage === "letter-draw" ? (
            <Button disabled fullWidth size="lg" variant="secondary">
              Losowanie litery...
            </Button>
          ) : game.timer.status === "running" ? (
            <>
              <Button fullWidth size="lg" variant="secondary" onClick={pauseTimer}>
                <Pause className="h-5 w-5" />
                Pauza
              </Button>
              <Button
                fullWidth
                size="lg"
                variant="danger"
                onClick={() => {
                  const result = triggerFinishCountdown();
                  if (!result.ok) {
                    showToast({
                      title: "Nie udało się uruchomić końcowego odliczania",
                      description: result.message,
                      tone: "warning",
                    });
                  }
                }}
              >
                <TimerReset className="h-5 w-5" />
                Ktoś skończył
              </Button>
            </>
          ) : game.timer.status === "paused" ? (
            <>
              <Button fullWidth size="lg" variant="primary" onClick={resumeTimer}>
                <Play className="h-5 w-5" />
                Wznów
              </Button>
              <Button fullWidth size="lg" variant="secondary" onClick={resetTimer}>
                <RotateCcw className="h-5 w-5" />
                Reset
              </Button>
            </>
          ) : (
            <>
              {!activeRound?.letter ? (
                <Button
                  disabled={!availableLetters.length}
                  fullWidth
                  size="lg"
                  variant="primary"
                  onClick={() => {
                    setIsLetterDrawing(true);
                    setSpinRequest((value) => value + 1);
                  }}
                >
                  Losuj literę
                </Button>
              ) : (
                <Button
                  fullWidth
                  size="lg"
                  variant="primary"
                  onClick={() => {
                    const result = startTimer();
                    if (!result.ok) {
                      showToast({
                        title: "Nie udało się uruchomić timera",
                        description: result.message,
                        tone: "warning",
                      });
                    }
                  }}
                >
                  <Play className="h-5 w-5" />
                  Start
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        confirmLabel="Zakończ i pokaż wyniki"
        description="Po zakończeniu nie będzie można dodawać kolejnych rund ani zmieniać punktów."
        open={endGameOpen}
        title="Czy na pewno chcesz zakończyć grę?"
        tone="danger"
        onClose={() => setEndGameOpen(false)}
        onConfirm={() => {
          endGame();
          setEndGameOpen(false);
          showToast({
            title: "Gra została zakończona",
            tone: "success",
          });
        }}
      />
    </main>
  );
}
