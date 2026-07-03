import { useMemo, useState } from "react";
import { CheckCircle2, Eraser, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PlayerBadge } from "@/features/game/components/PlayerBadge";
import type { Player, ScoreEntry } from "@/features/game/gameTypes";

const quickValues = [0, 5, 10, 15, 20, 25];

type QuickScoreCardProps = {
  player: Pick<Player, "id" | "name" | "colorIndex">;
  entry: ScoreEntry | undefined;
  disabled?: boolean;
  roundLabel?: string;
  confirmed?: boolean;
  layout?: "compact" | "play";
  onAddValue: (value: number) => void;
  onUndo: () => void;
  onClear: () => void;
  onToggleConfirmed?: () => void;
};

export function QuickScoreCard({
  player,
  entry,
  disabled = false,
  roundLabel,
  confirmed = false,
  layout = "compact",
  onAddValue,
  onUndo,
  onClear,
  onToggleConfirmed,
}: QuickScoreCardProps) {
  const [confirmClear, setConfirmClear] = useState(false);
  const safeEntry = entry ?? { total: 0, additions: [] };
  const latestAdditions = useMemo(() => safeEntry.additions.slice(-4), [safeEntry.additions]);
  const isPlayLayout = layout === "play";

  return (
    <div
      className={
        isPlayLayout
          ? "rounded-[28px] border border-line bg-white p-5 shadow-card"
          : "min-w-[220px] space-y-3"
      }
    >
      <div className={isPlayLayout ? "" : "rounded-2xl border border-line bg-slate-50 px-3 py-3"}>
        <PlayerBadge player={player} size={isPlayLayout ? "lg" : "md"} />
        <div className={isPlayLayout ? "mt-5" : "mt-3"}>
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
            {roundLabel ? `${player.name} · ${roundLabel}` : "Wynik rundy"}
          </div>
          <div className={isPlayLayout ? "mt-2 text-5xl font-semibold text-ink" : "mt-2 text-3xl font-semibold text-ink"}>
            {safeEntry.total}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {latestAdditions.length ? (
              latestAdditions.map((addition, index) => (
                <span
                  key={`${addition}-${index}`}
                  className="rounded-full border border-line bg-white px-2.5 py-1 text-xs font-semibold text-slate-700"
                >
                  +{addition}
                </span>
              ))
            ) : (
              <span className="text-xs text-muted">Brak dodanych punktów</span>
            )}
          </div>
        </div>
      </div>

      <div className={isPlayLayout ? "mt-5 grid grid-cols-3 gap-3" : "grid grid-cols-3 gap-2"}>
        {quickValues.map((quickValue) => (
          <button
            key={quickValue}
            className={
              isPlayLayout
                ? "min-h-14 rounded-2xl border border-line bg-slate-50 px-3 py-2 text-lg font-semibold text-slate-700 transition hover:border-primary/30 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                : "min-h-11 rounded-2xl border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary/30 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
            }
            disabled={disabled}
            type="button"
            onClick={() => {
              if (quickValue === 0 && safeEntry.total > 0) {
                setConfirmClear(true);
                return;
              }
              onAddValue(quickValue);
            }}
          >
            {quickValue}
          </button>
        ))}
      </div>

      <div className={isPlayLayout ? "mt-5 flex flex-wrap gap-2" : "flex flex-wrap gap-2"}>
        <Button
          disabled={disabled || !safeEntry.additions.length}
          size={isPlayLayout ? "md" : "sm"}
          variant="secondary"
          onClick={onUndo}
        >
          <Undo2 className="h-4 w-4" />
          Cofnij
        </Button>
        <Button
          disabled={disabled || safeEntry.total === 0}
          size={isPlayLayout ? "md" : "sm"}
          variant="secondary"
          onClick={() => setConfirmClear(true)}
        >
          <Eraser className="h-4 w-4" />
          Wyczyść
        </Button>
        {onToggleConfirmed ? (
          <Button
            size={isPlayLayout ? "md" : "sm"}
            variant={confirmed ? "soft" : "secondary"}
            onClick={onToggleConfirmed}
          >
            <CheckCircle2 className="h-4 w-4" />
            {confirmed ? "Punkty wpisane" : "Gotowe"}
          </Button>
        ) : null}
      </div>

      {confirmClear ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
          <div>Wyzerować wynik tej rundy?</div>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setConfirmClear(false)}
            >
              Anuluj
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                onClear();
                setConfirmClear(false);
              }}
            >
              Wyzeruj
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
