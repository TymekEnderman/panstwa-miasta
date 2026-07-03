import { RotateCcw, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  ALL_SUPPORTED_LETTERS,
  DEFAULT_ALPHABET_LETTERS,
  EXTRA_GAME_LETTERS,
  OPTIONAL_POLISH_LETTERS,
} from "@/features/game/gameUtils";
import type { AlphabetSettings } from "@/features/game/gameTypes";
import { cx } from "@/lib/cx";

type AlphabetSettingsModalProps = {
  open: boolean;
  settings: AlphabetSettings;
  gameStarted: boolean;
  usedLetters: string[];
  onClose: () => void;
  onSave: (enabledLetters: string[]) => { ok: boolean; message?: string };
};

export function AlphabetSettingsModal({
  open,
  settings,
  gameStarted,
  usedLetters,
  onClose,
  onSave,
}: AlphabetSettingsModalProps) {
  const [draft, setDraft] = useState(settings.enabledLetters);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(settings.enabledLetters);
      setError(null);
    }
  }, [open, settings.enabledLetters]);

  const activeCount = draft.length;
  const usedSet = useMemo(() => new Set(usedLetters), [usedLetters]);
  const hasRunningHistory = gameStarted || usedLetters.length > 0;

  const toggleLetter = (letter: string) => {
    setDraft((current) =>
      current.includes(letter)
        ? current.filter((item) => item !== letter)
        : ALL_SUPPORTED_LETTERS.filter((item) => item === letter || current.includes(item)),
    );
  };

  const saveAlphabet = () => {
    if (draft.length < 2) {
      setError("Wybierz co najmniej 2 litery.");
      return;
    }

    const result = onSave(draft);

    if (!result.ok) {
      setError(result.message ?? "Nie udało się zapisać alfabetu.");
      return;
    }

    onClose();
  };

  return (
    <Modal
      description="Wybierz litery dostępne do losowania w tej grze. Wykorzystane litery pozostają w historii."
      open={open}
      title="Alfabet gry"
      widthClassName="max-w-4xl"
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setDraft([...ALL_SUPPORTED_LETTERS])}
            >
              Zaznacz wszystkie
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setDraft([])}
            >
              <Trash2 className="h-4 w-4" />
              Wyczyść
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setDraft([...DEFAULT_ALPHABET_LETTERS])}
            >
              <RotateCcw className="h-4 w-4" />
              Przywróć domyślne
            </Button>
          </div>
          <Button variant="primary" onClick={saveAlphabet}>
            <Save className="h-4 w-4" />
            Zapisz alfabet
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-line bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Aktywnych liter: <span className="font-semibold">{activeCount}</span>
        </div>

        {hasRunningHistory ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Gra już trwa. Zmiany alfabetu wpłyną tylko na kolejne losowania.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        ) : null}

        <LetterGroup
          draft={draft}
          title="Domyślny alfabet"
          usedSet={usedSet}
          letters={[...DEFAULT_ALPHABET_LETTERS]}
          onToggle={toggleLetter}
        />
        <LetterGroup
          draft={draft}
          title="Polskie litery dodatkowe"
          usedSet={usedSet}
          letters={[...OPTIONAL_POLISH_LETTERS]}
          onToggle={toggleLetter}
        />
        <LetterGroup
          draft={draft}
          title="Litery dodatkowe"
          usedSet={usedSet}
          letters={[...EXTRA_GAME_LETTERS]}
          onToggle={toggleLetter}
        />
      </div>
    </Modal>
  );
}

function LetterGroup({
  title,
  letters,
  draft,
  usedSet,
  onToggle,
}: {
  title: string;
  letters: string[];
  draft: string[];
  usedSet: Set<string>;
  onToggle: (letter: string) => void;
}) {
  return (
    <section>
      <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-3">
        {letters.map((letter) => {
          const enabled = draft.includes(letter);
          const used = usedSet.has(letter);

          return (
            <button
              key={letter}
              className={cx(
                "min-w-12 rounded-2xl border px-4 py-3 text-base font-semibold transition",
                enabled
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-line bg-white text-slate-700 hover:border-primary/25 hover:bg-primary/5",
              )}
              type="button"
              onClick={() => onToggle(letter)}
            >
              <span>{letter}</span>
              {used ? <span className="ml-2 text-xs text-amber-700">użyta</span> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
