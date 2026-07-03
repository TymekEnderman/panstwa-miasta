import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Crown, Medal, RotateCcw, ScrollText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { CategorySnapshot } from "@/features/categories/categoryTypes";
import type { RankingEntry, Round } from "@/features/game/gameTypes";
import { getPlayerInitial, PLAYER_ACCENTS } from "@/features/game/gameUtils";
import { gameAudio } from "@/lib/audio";
import { cx } from "@/lib/cx";

type GameSummaryProps = {
  ranking: RankingEntry[];
  rounds: Round[];
  usedLetters: string[];
  categories: CategorySnapshot[];
  soundEnabled: boolean;
  onReturn: () => void;
  onNewGame: () => void;
};

const podiumHeights = ["h-[110px]", "h-[180px]", "h-[140px]"];

export function GameSummary({
  ranking,
  rounds,
  usedLetters,
  categories,
  soundEnabled,
  onReturn,
  onNewGame,
}: GameSummaryProps) {
  const prefersReducedMotion = useReducedMotion();
  const [revealedCount, setRevealedCount] = useState(prefersReducedMotion ? 3 : 0);
  const [showRanking, setShowRanking] = useState(prefersReducedMotion);
  const topThree = useMemo(() => {
    const uniquePlaces = Array.from(new Set(ranking.map((entry) => entry.place))).slice(0, 3);
    return uniquePlaces.map((place) => ranking.filter((entry) => entry.place === place));
  }, [ranking]);
  const winnerPlace = ranking[0]?.place ?? 1;
  const isTopTie = ranking.filter((entry) => entry.place === winnerPlace).length > 1;

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    if (soundEnabled) {
      gameAudio.playVictory();
    }

    const steps = [0, 1, 2].map((index) =>
      window.setTimeout(() => {
        setRevealedCount(index + 1);
      }, 420 + index * 380),
    );
    const rankingTimer = window.setTimeout(() => setShowRanking(true), 1700);

    return () => {
      steps.forEach((timerId) => window.clearTimeout(timerId));
      window.clearTimeout(rankingTimer);
    };
  }, [prefersReducedMotion, soundEnabled]);

  const hasOnePlayer = ranking.length === 1;
  const hasTwoPlayers = ranking.length === 2;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
      <div className="page-frame">
        <div className="glass-card relative overflow-hidden p-6 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_30%)]" />
          <div className="relative">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                  <Sparkles className="h-4 w-4" />
                  Finał rozgrywki
                </div>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink">
                  {isTopTie ? "Remis na pierwszym miejscu!" : "Mamy zwycięzcę"}
                </h2>
                <p className="mt-2 text-base text-muted">
                  {hasOnePlayer
                    ? "To indywidualne podsumowanie całej partii."
                    : "Podium odsłania się stopniowo, a pełny ranking pojawia się chwilę później."}
                </p>
              </div>

              <Button
                variant="secondary"
                onClick={() => {
                  setRevealedCount(3);
                  setShowRanking(true);
                }}
              >
                Pomiń animację
              </Button>
            </div>

            <div className="mt-8">
              {hasOnePlayer ? (
                <SinglePlayerSummary entry={ranking[0]} />
              ) : (
                <PodiumStage
                  hasTwoPlayers={hasTwoPlayers}
                  revealedCount={revealedCount}
                  topThree={topThree}
                />
              )}
            </div>

            <AnimatePresence>
              {showRanking ? (
                <motion.div
                  className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="space-y-4">
                    <div className="rounded-3xl border border-line bg-white/85 p-5">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <Medal className="h-4 w-4" />
                        Pełny ranking
                      </div>
                      <div className="mt-4 space-y-3">
                        {ranking.map((entry) => (
                          <RankingRow key={entry.playerId} entry={entry} />
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-line bg-white/85 p-5">
                      <div className="text-sm font-medium text-slate-700">Wyniki rund</div>
                      <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full border-separate border-spacing-0 rounded-3xl border border-line">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="border-b border-line px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                Runda
                              </th>
                              {ranking.map((entry) => (
                                <th
                                  key={entry.playerId}
                                  className="border-b border-l border-line px-4 py-3 text-left text-sm font-semibold text-slate-700"
                                >
                                  {entry.playerName}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rounds.map((round) => (
                              <tr key={round.id}>
                                <td className="border-b border-line px-4 py-3 text-sm text-ink">
                                  Runda {round.number} · {round.letter ?? "brak"}
                                </td>
                                {ranking.map((entry) => (
                                  <td
                                    key={entry.playerId}
                                    className="border-b border-l border-line px-4 py-3 text-sm text-ink"
                                  >
                                    {round.scores[entry.playerId]?.total ?? 0}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <InfoCard label="Rozegrane rundy" value={String(rounds.length)} />
                    <DetailCard
                      icon={<ScrollText className="h-4 w-4" />}
                      title="Wykorzystane litery"
                    >
                      <div className="flex flex-wrap gap-2">
                        {usedLetters.map((letter, index) => (
                          <span
                            key={`${letter}-${index}`}
                            className="rounded-xl border border-line bg-white px-3 py-1 text-sm font-semibold text-ink"
                          >
                            {letter}
                          </span>
                        ))}
                      </div>
                    </DetailCard>
                    <DetailCard
                      icon={<Crown className="h-4 w-4" />}
                      title="Kategorie używane w grze"
                    >
                      <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                          <span
                            key={category.id}
                            className="rounded-xl border border-line bg-white px-3 py-1 text-sm text-ink"
                          >
                            {category.name}
                          </span>
                        ))}
                      </div>
                    </DetailCard>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={onReturn}>
                Wróć do wyników
              </Button>
              <Button variant="primary" onClick={onNewGame}>
                <RotateCcw className="h-4 w-4" />
                Nowa gra
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PodiumStage({
  topThree,
  revealedCount,
  hasTwoPlayers,
}: {
  topThree: RankingEntry[][];
  revealedCount: number;
  hasTwoPlayers: boolean;
}) {
  const orderedPlaces = hasTwoPlayers ? [1, 0] : [2, 0, 1];

  return (
    <div className="grid items-end gap-4 lg:grid-cols-3">
      {orderedPlaces.map((slotIndex, displayIndex) => {
        const entries = topThree[slotIndex] ?? [];
        const isVisible = revealedCount > displayIndex;
        const topEntry = entries[0];

        return (
          <motion.div
            key={`podium-${slotIndex}`}
            className={cx(
              "rounded-[28px] border border-line bg-white/90 p-5 shadow-card",
              hasTwoPlayers && slotIndex === 0 ? "lg:order-2" : "",
            )}
            initial={{ opacity: 0, y: 40 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.28 }}
          >
            {topEntry ? (
              <>
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
                  {entries.length > 1 ? `${topEntry.place}. miejsce ex aequo` : `${topEntry.place}. miejsce`}
                </div>
                <div className={cx("mt-3 rounded-[24px] border px-4 py-4", PLAYER_ACCENTS[topEntry.colorIndex])}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-white/70 text-lg font-bold">
                    {getPlayerInitial(topEntry.playerName)}
                  </div>
                  <div className="mt-3 font-semibold">{topEntry.playerName}</div>
                  <div className="mt-1 text-sm opacity-80">{topEntry.total} pkt</div>
                  {entries.length > 1 ? (
                    <div className="mt-2 text-xs opacity-75">
                      + {entries.slice(1).map((entry) => entry.playerName).join(", ")}
                    </div>
                  ) : null}
                </div>
                <div className={cx("mt-4 rounded-t-[28px] bg-slate-100", podiumHeights[slotIndex] ?? podiumHeights[0])} />
              </>
            ) : (
              <div className="flex h-full min-h-[220px] items-center justify-center rounded-[24px] border border-dashed border-line bg-slate-50 text-sm text-muted">
                Brak miejsca na podium
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

function SinglePlayerSummary({ entry }: { entry?: RankingEntry }) {
  if (!entry) {
    return null;
  }

  return (
    <div className="rounded-[28px] border border-line bg-white/90 p-6 shadow-card">
      <div className={cx("rounded-[24px] border px-5 py-5", PLAYER_ACCENTS[entry.colorIndex])}>
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-white/70 text-lg font-bold">
          {getPlayerInitial(entry.playerName)}
        </div>
        <div className="mt-4 text-2xl font-semibold">{entry.playerName}</div>
        <div className="mt-2 text-base opacity-85">Łączny wynik: {entry.total} pkt</div>
      </div>
    </div>
  );
}

function RankingRow({ entry }: { entry: RankingEntry }) {
  return (
    <div className="flex items-center justify-between rounded-3xl border border-line bg-slate-50 px-4 py-4">
      <div className="flex items-center gap-3">
        <div className={cx("flex h-10 w-10 items-center justify-center rounded-full border font-semibold", PLAYER_ACCENTS[entry.colorIndex])}>
          {getPlayerInitial(entry.playerName)}
        </div>
        <div>
          <div className="font-semibold text-ink">
            {entry.place}. {entry.playerName}
          </div>
          <div className="text-sm text-muted">
            {entry.isTied ? "Remis na tym miejscu" : "Samodzielne miejsce"}
          </div>
        </div>
      </div>
      <div className="text-xl font-semibold text-ink">{entry.total}</div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-line bg-white/85 p-5">
      <div className="text-sm font-medium text-slate-700">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-ink">{value}</div>
    </div>
  );
}

function DetailCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-line bg-white/85 p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}
