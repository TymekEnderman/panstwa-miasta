import { useEffect, useMemo, useState } from "react";
import { History, PlusSquare, Power } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { showToast } from "@/components/ui/toastStore";
import { useCategoryStore } from "@/features/categories/categoryStore";
import { getActiveCategoryCounts } from "@/features/categories/categoryUtils";
import { AlphabetSettingsModal } from "@/features/game/components/AlphabetSettingsModal";
import { CategoryDrawSettings } from "@/features/game/components/CategoryDrawSettings";
import { GameHeader } from "@/features/game/components/GameHeader";
import { GameSummary } from "@/features/game/components/GameSummary";
import { LetterWheel } from "@/features/game/components/LetterWheel";
import { PlayerScoreTable } from "@/features/game/components/PlayerScoreTable";
import { RoundTimer } from "@/features/game/components/RoundTimer";
import { useGameStore } from "@/features/game/gameStore";
import {
  getActiveRound,
  getAvailableLetters,
  getRanking,
  getRoundById,
  hasGameStarted,
  isRoundReadyToAdvance,
} from "@/features/game/gameUtils";
import { cx } from "@/lib/cx";

type CategoryChangeIntent =
  | { type: "drawAll" }
  | { type: "rerollOne"; categoryId: string }
  | null;

export function GamePage() {
  const categories = useCategoryStore((state) => state.categories);
  const game = useGameStore((state) => state.game);
  const syncCategoryAvailability = useGameStore((state) => state.syncCategoryAvailability);
  const commitDrawnLetter = useGameStore((state) => state.commitDrawnLetter);
  const setDrawSetting = useGameStore((state) => state.setDrawSetting);
  const drawCategories = useGameStore((state) => state.drawCategories);
  const rerollCategory = useGameStore((state) => state.rerollCategory);
  const rerollAllCategories = useGameStore((state) => state.rerollAllCategories);
  const toggleCategoryLock = useGameStore((state) => state.toggleCategoryLock);
  const updateAlphabet = useGameStore((state) => state.updateAlphabet);
  const addRound = useGameStore((state) => state.addRound);
  const addPlayer = useGameStore((state) => state.addPlayer);
  const updatePlayerName = useGameStore((state) => state.updatePlayerName);
  const removePlayer = useGameStore((state) => state.removePlayer);
  const forceRemovePlayer = useGameStore((state) => state.forceRemovePlayer);
  const movePlayer = useGameStore((state) => state.movePlayer);
  const addScoreValue = useGameStore((state) => state.addScoreValue);
  const undoScore = useGameStore((state) => state.undoLastScoreAddition);
  const clearScore = useGameStore((state) => state.clearScore);
  const endGame = useGameStore((state) => state.endGame);
  const newGame = useGameStore((state) => state.newGame);
  const [endGameOpen, setEndGameOpen] = useState(false);
  const [removePlayerId, setRemovePlayerId] = useState<string | null>(null);
  const [newGameOpen, setNewGameOpen] = useState(false);
  const [summaryVisible, setSummaryVisible] = useState(game.status === "finished");
  const [selectedRoundId, setSelectedRoundId] = useState(game.activeRoundId);
  const [spinRequest, setSpinRequest] = useState(0);
  const [categoryChangeIntent, setCategoryChangeIntent] = useState<CategoryChangeIntent>(null);
  const [alphabetOpen, setAlphabetOpen] = useState(false);

  const activeRound = useMemo(() => getActiveRound(game), [game]);
  const previewRound = useMemo(
    () => getRoundById(game.rounds, selectedRoundId),
    [game.rounds, selectedRoundId],
  );
  const ranking = useMemo(() => getRanking(game), [game]);
  const activeCategoryCounts = useMemo(() => getActiveCategoryCounts(categories), [categories]);
  const roundReadiness = activeRound ? isRoundReadyToAdvance(activeRound) : { canAdvance: false, missing: [] };
  const totalRequested = Object.values(game.categoryDrawSettings).reduce((sum, value) => sum + value, 0);
  const gameStarted = hasGameStarted(game);
  const availableLetters = useMemo(() => getAvailableLetters(game), [game]);

  useEffect(() => {
    syncCategoryAvailability(categories);
  }, [categories, syncCategoryAvailability]);

  useEffect(() => {
    setSelectedRoundId(game.activeRoundId);
  }, [game.activeRoundId]);

  useEffect(() => {
    if (game.status === "finished") {
      setSummaryVisible(true);
    }
  }, [game.status]);

  const actionsLocked = game.status === "finished";

  const handleAddRound = () => {
    const result = addRound();

    if (!result.ok) {
      showToast({
        title: "Nie można dodać rundy",
        description: result.message,
        tone: "warning",
      });
      return;
    }

    window.setTimeout(() => {
      const scoreTable = document.getElementById("score-table");

      if (typeof scoreTable?.scrollIntoView === "function") {
        scoreTable.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 10);

    showToast({
      title: `Dodano rundę ${result.roundNumber}.`,
      tone: "success",
    });
  };

  const executeCategoryIntent = (intent: CategoryChangeIntent) => {
    if (!intent) {
      return;
    }

    if (intent.type === "drawAll") {
      const result = game.selectedCategories.length
        ? rerollAllCategories(categories)
        : drawCategories(categories);

      if (!result.ok) {
        showToast({
          title: "Nie udało się przygotować kategorii",
          description: result.message,
          tone: "warning",
        });
        return;
      }

      showToast({
        title: game.selectedCategories.length
          ? "Zmieniono wspólny zestaw kategorii"
          : `Wylosowano ${totalRequested} kategorii`,
        tone: "success",
      });
      return;
    }

    const result = rerollCategory(categories, intent.categoryId);

    if (!result.ok) {
      showToast({
        title: "Nie udało się wymienić kategorii",
        description: result.message,
        tone: "warning",
      });
      return;
    }

    showToast({
      title: "Wylosowano nową kategorię",
      tone: "success",
    });
  };

  return (
    <main className="app-shell">
      <div className="page-frame space-y-6">
        {summaryVisible && game.status === "finished" ? (
          <GameSummary
            categories={game.selectedCategories}
            ranking={ranking}
            rounds={game.rounds}
            soundEnabled={game.soundEnabled}
            usedLetters={game.usedLetters}
            onNewGame={() => setNewGameOpen(true)}
            onReturn={() => setSummaryVisible(false)}
          />
        ) : null}

        <GameHeader
          disableAddRound={actionsLocked || !roundReadiness.canAdvance}
          disableLetterDraw={
            actionsLocked || Boolean(activeRound?.letter) || !availableLetters.length
          }
          onAddRound={handleAddRound}
          onDrawLetter={() => setSpinRequest((value) => value + 1)}
        />

        <Card
          title="Historia rund"
          subtitle="Kliknij rundę, aby szybko podejrzeć jej literę i zestaw kategorii zapisany dla tej części gry."
        >
          <div className="flex flex-wrap gap-3">
            {game.rounds.map((round) => (
              <button
                key={round.id}
                className={cx(
                  "rounded-2xl border px-4 py-3 text-left transition",
                  selectedRoundId === round.id
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-line bg-white text-ink hover:border-primary/25 hover:bg-primary/5",
                )}
                type="button"
                onClick={() => setSelectedRoundId(round.id)}
              >
                <div className="font-semibold">Runda {round.number}</div>
                <div className="mt-1 text-sm">
                  Litera: {round.letter ?? "brak"} · {round.categorySnapshot.length} kategorii
                </div>
              </button>
            ))}
          </div>

          {previewRound ? (
            <div className="mt-5 rounded-3xl border border-line bg-slate-50 px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <History className="h-4 w-4" />
                Podgląd rundy {previewRound.number}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink">
                <span className="rounded-full border border-line bg-white px-3 py-1.5 font-semibold">
                  Litera: {previewRound.letter ?? "brak"}
                </span>
                {previewRound.categorySnapshot.map((category) => (
                  <span
                    key={category.id}
                    className="rounded-full border border-line bg-white px-3 py-1.5"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(380px,1fr)]">
          <LetterWheel
            availableLetters={availableLetters}
            currentLetter={activeRound?.letter ?? game.currentDrawnLetter}
            drawDisabled={
              actionsLocked || Boolean(activeRound?.letter) || !availableLetters.length
            }
            soundEnabled={game.soundEnabled}
            spinRequest={spinRequest}
            usedLetters={game.usedLetters}
            onCustomizeAlphabet={() => setAlphabetOpen(true)}
            onDrawResolved={(letter) => {
              const result = commitDrawnLetter(letter);

              if (!result.ok) {
                showToast({
                  title: "Nie udało się zapisać litery",
                  description: result.message,
                  tone: "warning",
                });
                return;
              }

              showToast({
                title: `Wylosowano literę ${letter}. Nie pojawi się ponownie w tej grze.`,
                tone: "success",
              });
            }}
          />

          <RoundTimer />

          <CategoryDrawSettings
            categories={game.selectedCategories}
            counts={activeCategoryCounts}
            gameStarted={gameStarted}
            lockedCategoryIds={game.lockedCategoryIds}
            settings={game.categoryDrawSettings}
            onChange={(difficulty, value) => setDrawSetting(difficulty, value, categories)}
            onDrawOrRerollAll={() => {
              const intent: CategoryChangeIntent = { type: "drawAll" };

              if (gameStarted && game.selectedCategories.length) {
                setCategoryChangeIntent(intent);
                return;
              }

              executeCategoryIntent(intent);
            }}
            onRerollCategory={(categoryId) => {
              const intent: CategoryChangeIntent = { type: "rerollOne", categoryId };

              if (gameStarted) {
                setCategoryChangeIntent(intent);
                return;
              }

              executeCategoryIntent(intent);
            }}
            onToggleCategoryLock={(categoryId) => {
              const result = toggleCategoryLock(categoryId);

              if (!result.ok) {
                showToast({
                  title: "Nie udało się zmienić blokady kategorii",
                  description: result.message,
                  tone: "warning",
                });
                return;
              }

              showToast({
                title: game.lockedCategoryIds.includes(categoryId)
                  ? "Kategoria została odblokowana"
                  : "Kategoria została zablokowana",
                tone: "success",
              });
            }}
          />
        </div>

        {!roundReadiness.canAdvance && !actionsLocked ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            Aby dodać nową rundę, brakuje: {roundReadiness.missing.join(" i ")}.
          </div>
        ) : null}

        <div id="score-table">
          <PlayerScoreTable
            locked={actionsLocked}
            players={game.players}
            rounds={game.rounds}
            onAddPlayer={() => {
              const result = addPlayer();

              if (!result.ok) {
                showToast({
                  title: "Nie udało się dodać gracza",
                  description: result.message,
                  tone: "warning",
                });
                return;
              }

              showToast({
                title: "Dodano nowego gracza",
                tone: "success",
              });
            }}
            onAddScoreValue={(roundId, playerId, value) => {
              const result = addScoreValue(roundId, playerId, value);

              if (result.needsConfirm) {
                clearScore(roundId, playerId);
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
            onClearScore={(roundId, playerId) => {
              clearScore(roundId, playerId);
              showToast({
                title: "Wynik rundy został wyczyszczony",
                tone: "success",
              });
            }}
            onMovePlayer={movePlayer}
            onRemovePlayer={(playerId) => {
              const result = removePlayer(playerId);

              if (result.needsConfirm) {
                setRemovePlayerId(playerId);
                return;
              }

              if (!result.ok) {
                showToast({
                  title: "Nie można usunąć gracza",
                  description: result.message,
                  tone: "warning",
                });
                return;
              }

              showToast({
                title: "Gracz został usunięty",
                tone: "success",
              });
            }}
            onRenamePlayer={(playerId, nextName) => {
              const result = updatePlayerName(playerId, nextName);

              if (!result.ok) {
                showToast({
                  title: "Nie udało się zmienić nazwy gracza",
                  description: result.message,
                  tone: "warning",
                });
                return;
              }

              if (result.changed) {
                showToast({
                  title: "Nazwa gracza została zaktualizowana",
                  tone: "success",
                });
              }
            }}
            onUndoScore={(roundId, playerId) => {
              const result = undoScore(roundId, playerId);

              if (!result.ok) {
                showToast({
                  title: "Nie udało się cofnąć punktów",
                  description: result.message,
                  tone: "warning",
                });
                return;
              }

              showToast({
                title: "Cofnięto ostatnie dodanie punktów",
                tone: "success",
              });
            }}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            className="min-w-[220px]"
            size="lg"
            variant="secondary"
            onClick={handleAddRound}
          >
            <PlusSquare className="h-5 w-5" />
            Dodaj rundę
          </Button>
          <Button
            className="min-w-[220px]"
            size="lg"
            variant="danger"
            onClick={() => setEndGameOpen(true)}
          >
            <Power className="h-5 w-5" />
            Zakończ grę
          </Button>
        </div>

        <Card className="bg-slate-50">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <div className="text-sm font-medium text-slate-700">Kategorie tej gry</div>
              <div className="mt-2 text-2xl font-semibold text-ink">{game.selectedCategories.length}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-700">Wykorzystane litery</div>
              <div className="mt-2 text-2xl font-semibold text-ink">{game.usedLetters.length}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-700">Lider na ten moment</div>
              <div className="mt-2 text-lg font-semibold text-ink">
                {ranking[0]?.playerName ?? "Brak"} {ranking[0] ? `· ${ranking[0].total} pkt` : ""}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <AlphabetSettingsModal
        gameStarted={gameStarted}
        open={alphabetOpen}
        settings={game.alphabetSettings}
        usedLetters={game.usedLetters}
        onClose={() => setAlphabetOpen(false)}
        onSave={(enabledLetters) => {
          const result = updateAlphabet(enabledLetters);

          if (result.ok) {
            showToast({
              title: "Zapisano alfabet gry",
              tone: "success",
            });
          }

          return result;
        }}
      />

      <ConfirmDialog
        confirmLabel="Usuń gracza"
        description="Ten gracz ma już zapisane punkty. Po usunięciu wynik zniknie z tabeli, ale historia rund pozostanie nienaruszona."
        open={Boolean(removePlayerId)}
        title="Usunąć gracza z punktami?"
        tone="danger"
        onClose={() => setRemovePlayerId(null)}
        onConfirm={() => {
          if (!removePlayerId) {
            return;
          }

          forceRemovePlayer(removePlayerId);
          setRemovePlayerId(null);
          showToast({
            title: "Gracz został usunięty",
            tone: "success",
          });
        }}
      />

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

      <ConfirmDialog
        confirmLabel="Zmień kategorie"
        description="Gra już się rozpoczęła. Zmiana wspólnego zestawu kategorii wpłynie na spójność rozgrywki i historię bieżącej rundy."
        open={Boolean(categoryChangeIntent)}
        title="Zmienić zestaw kategorii po starcie gry?"
        onClose={() => setCategoryChangeIntent(null)}
        onConfirm={() => {
          executeCategoryIntent(categoryChangeIntent);
          setCategoryChangeIntent(null);
        }}
      />

      <Modal
        description="Nowa gra wyczyści rundy, punkty, litery i wspólny zestaw kategorii. Baza kategorii, dźwięki i alfabet gry pozostaną bez zmian."
        open={newGameOpen}
        title="Rozpocząć nową grę?"
        onClose={() => setNewGameOpen(false)}
        footer={
          <div className="flex flex-col gap-3">
            <Button
              fullWidth
              variant="primary"
              onClick={() => {
                newGame({ preservePlayers: true });
                setSummaryVisible(false);
                setNewGameOpen(false);
                showToast({
                  title: "Rozpoczęto nową grę z zachowaniem graczy",
                  tone: "success",
                });
              }}
            >
              Zachowaj obecnych graczy
            </Button>
            <Button
              fullWidth
              variant="secondary"
              onClick={() => {
                newGame({ preservePlayers: false });
                setSummaryVisible(false);
                setNewGameOpen(false);
                showToast({
                  title: "Rozpoczęto zupełnie nową grę",
                  tone: "success",
                });
              }}
            >
              Rozpocznij z nową listą graczy
            </Button>
          </div>
        }
      >
        <p className="text-sm leading-6 text-slate-700">Czy zachować obecnych graczy?</p>
      </Modal>
    </main>
  );
}
