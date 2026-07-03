import { Crown, Gamepad2, Grid2x2, PlusSquare, Shuffle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

type GameHeaderProps = {
  disableLetterDraw?: boolean;
  disableAddRound?: boolean;
  onDrawLetter: () => void;
  onAddRound: () => void;
};

export function GameHeader({
  disableLetterDraw,
  disableAddRound,
  onDrawLetter,
  onAddRound,
}: GameHeaderProps) {
  return (
    <header className="glass-card p-5 sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-white shadow-float">
            <Crown className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-ink">Państwa Miasta</h1>
            <p className="mt-1 text-lg text-muted">Panel gry</p>
            <p className="mt-1 text-sm text-muted">
              Konfiguracja, gracze, alfabet, kategorie i pełna tabela punktów.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link to="/game/play">
            <Button className="w-full sm:w-auto" size="lg" variant="primary">
              <Gamepad2 className="h-5 w-5" />
              Uruchom tryb gry
            </Button>
          </Link>
          <Link to="/categories">
            <Button className="w-full sm:w-auto" size="lg" variant="secondary">
              <Grid2x2 className="h-5 w-5" />
              Kategorie
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <Button
          disabled={disableLetterDraw}
          size="lg"
          variant="primary"
          onClick={onDrawLetter}
        >
          <Shuffle className="h-5 w-5" />
          Losuj literę
        </Button>
        <Button
          disabled={disableAddRound}
          size="lg"
          variant="secondary"
          onClick={onAddRound}
        >
          <PlusSquare className="h-5 w-5" />
          Dodaj rundę
        </Button>
      </div>
    </header>
  );
}
