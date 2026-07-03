import { useEffect, useState } from "react";
import { ArrowLeftRight, PencilLine, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PlayerBadge } from "@/features/game/components/PlayerBadge";
import { QuickScoreCard } from "@/features/game/components/QuickScoreCard";
import type { Player, Round } from "@/features/game/gameTypes";
import { normalizeWhitespace } from "@/lib/validation";

type PlayerScoreTableProps = {
  rounds: Round[];
  players: Player[];
  locked: boolean;
  onAddPlayer: () => void;
  onRenamePlayer: (playerId: string, nextName: string) => void;
  onMovePlayer: (playerId: string, direction: "left" | "right") => void;
  onRemovePlayer: (playerId: string) => void;
  onAddScoreValue: (roundId: string, playerId: string, value: number) => void;
  onUndoScore: (roundId: string, playerId: string) => void;
  onClearScore: (roundId: string, playerId: string) => void;
};

export function PlayerScoreTable({
  rounds,
  players,
  locked,
  onAddPlayer,
  onRenamePlayer,
  onMovePlayer,
  onRemovePlayer,
  onAddScoreValue,
  onUndoScore,
  onClearScore,
}: PlayerScoreTableProps) {
  return (
    <Card
      className="overflow-hidden"
      headerAction={
        <Button disabled={locked || players.length >= 10} variant="secondary" onClick={onAddPlayer}>
          <Plus className="h-4 w-4" />
          Dodaj gracza
        </Button>
      }
      subtitle="Punkty dodajesz wielokrotnym klikaniem gotowych wartości w każdej komórce."
      title="Tabela graczy"
    >
      <div className="mb-5 grid gap-3 xl:grid-cols-3">
        {players.map((player, index) => (
          <PlayerManagerCard
            key={player.id}
            canMoveLeft={index > 0}
            canMoveRight={index < players.length - 1}
            locked={locked}
            player={player}
            onMove={onMovePlayer}
            onRemove={onRemovePlayer}
            onRename={onRenamePlayer}
          />
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 rounded-3xl border border-line">
          <thead className="bg-slate-50">
            <tr>
              <th className="border-b border-line px-4 py-3 text-left text-sm font-semibold text-slate-700">
                Runda
              </th>
              {players.map((player) => (
                <th
                  key={player.id}
                  className="border-b border-l border-line px-4 py-3 text-left text-sm font-semibold text-slate-700"
                >
                  <PlayerBadge player={player} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rounds.map((round) => (
              <tr key={round.id}>
                <td className="border-b border-line px-4 py-4 align-top text-sm font-semibold text-ink">
                  <div>Runda {round.number}</div>
                  <div className="mt-1 text-xs font-normal text-muted">
                    Litera: {round.letter ?? "brak"}
                  </div>
                </td>
                {players.map((player) => (
                  <td
                    key={player.id}
                    className="border-b border-l border-line px-4 py-3 align-top"
                  >
                    <QuickScoreCard
                      disabled={locked}
                      entry={round.scores[player.id]}
                      player={player}
                      roundLabel={`Runda ${round.number}`}
                      onAddValue={(value) => onAddScoreValue(round.id, player.id, value)}
                      onClear={() => onClearScore(round.id, player.id)}
                      onUndo={() => onUndoScore(round.id, player.id)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function PlayerManagerCard({
  player,
  locked,
  canMoveLeft,
  canMoveRight,
  onRename,
  onMove,
  onRemove,
}: {
  player: Player;
  locked: boolean;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onRename: (playerId: string, nextName: string) => void;
  onMove: (playerId: string, direction: "left" | "right") => void;
  onRemove: (playerId: string) => void;
}) {
  const [name, setName] = useState(player.name);

  useEffect(() => {
    setName(player.name);
  }, [player.name]);

  const commitName = () => {
    const normalized = normalizeWhitespace(name);

    if (normalized === player.name) {
      setName(player.name);
      return;
    }

    onRename(player.id, normalized || name);
  };

  return (
    <div className="rounded-3xl border border-line bg-slate-50 px-4 py-4">
      <div className="flex items-center justify-between gap-2">
        <PlayerBadge player={player} />
        <div className="flex items-center gap-1">
          <Button
            aria-label={`Przesuń gracza ${player.name} w lewo`}
            className="h-9 w-9 rounded-full p-0"
            disabled={!canMoveLeft || locked}
            variant="ghost"
            onClick={() => onMove(player.id, "left")}
          >
            <ArrowLeftRight className="h-4 w-4 -scale-x-100" />
          </Button>
          <Button
            aria-label={`Przesuń gracza ${player.name} w prawo`}
            className="h-9 w-9 rounded-full p-0"
            disabled={!canMoveRight || locked}
            variant="ghost"
            onClick={() => onMove(player.id, "right")}
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
          <Button
            aria-label={`Usuń gracza ${player.name}`}
            className="h-9 w-9 rounded-full p-0"
            disabled={locked}
            variant="ghost"
            onClick={() => onRemove(player.id)}
          >
            <Trash2 className="h-4 w-4 text-rose-600" />
          </Button>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className="min-h-11 flex-1 rounded-2xl border border-line bg-white px-3 text-sm"
          disabled={locked}
          value={name}
          onBlur={commitName}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitName();
            }
          }}
        />
        <Button disabled={locked} variant="secondary" onClick={commitName}>
          <PencilLine className="h-4 w-4" />
          Zapisz
        </Button>
      </div>
    </div>
  );
}
