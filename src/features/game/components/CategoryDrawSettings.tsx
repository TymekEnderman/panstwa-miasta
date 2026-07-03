import { Lock, LockOpen, RefreshCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { NumberStepper } from "@/components/ui/NumberStepper";
import { CategoryInfoPopover } from "@/features/categories/components/CategoryInfoPopover";
import { DIFFICULTY_ICONS } from "@/features/categories/difficultyVisuals";
import {
  DIFFICULTY_META,
  type CategorySnapshot,
  type Difficulty,
} from "@/features/categories/categoryTypes";
import { cx } from "@/lib/cx";
import { formatAvailability, formatCategoryCount } from "@/lib/pluralization";

type CategoryDrawSettingsProps = {
  counts: Record<Difficulty, number>;
  settings: Record<Difficulty, number>;
  categories: CategorySnapshot[];
  lockedCategoryIds: string[];
  gameStarted: boolean;
  onChange: (difficulty: Difficulty, value: number) => void;
  onDrawOrRerollAll: () => void;
  onToggleCategoryLock: (categoryId: string) => void;
  onRerollCategory: (categoryId: string) => void;
};

export function CategoryDrawSettings({
  counts,
  settings,
  categories,
  lockedCategoryIds,
  gameStarted,
  onChange,
  onDrawOrRerollAll,
  onToggleCategoryLock,
  onRerollCategory,
}: CategoryDrawSettingsProps) {
  const totalSelected = Object.values(settings).reduce((sum, value) => sum + value, 0);

  return (
    <Card
      title="Kategorie do gry"
      subtitle="Ustaw, ile kategorii ma wejść do wspólnego zestawu dla całej rozgrywki."
    >
      <div className="space-y-3">
        {(Object.keys(settings) as Difficulty[]).map((difficulty) => {
          const meta = DIFFICULTY_META[difficulty];
          const Icon = DIFFICULTY_ICONS[difficulty];

          return (
            <div
              key={difficulty}
              className="flex flex-col gap-3 rounded-3xl border border-line bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={cx("rounded-2xl p-2", meta.soft)}>
                  <Icon className={cx("h-5 w-5", meta.accent.split(" ")[0])} />
                </div>
                <div>
                  <div className="font-semibold text-ink">{meta.label}</div>
                  <div className="text-sm text-muted">{formatAvailability(counts[difficulty])}</div>
                </div>
              </div>

              <NumberStepper
                compact
                label={meta.label}
                max={counts[difficulty]}
                value={settings[difficulty]}
                onChange={(value) => onChange(difficulty, value)}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-slate-50 px-4 py-3 text-sm text-slate-700">
        Łącznie: <span className="font-semibold">{formatCategoryCount(totalSelected)}</span>
        {totalSelected === 0 ? (
          <div className="mt-1 text-rose-600">Wybierz przynajmniej jedną kategorię.</div>
        ) : null}
      </div>

      <div className="mt-4">
        <Button
          disabled={totalSelected === 0}
          fullWidth
          size="lg"
          variant={categories.length ? "secondary" : "primary"}
          onClick={onDrawOrRerollAll}
        >
          <RefreshCcw className="h-4 w-4" />
          {categories.length ? "Losuj ponownie" : "Losuj kategorie"}
        </Button>
      </div>

      <div className="mt-6">
        <div className="mb-3">
          <div className="text-base font-semibold text-ink">Kategorie tej gry</div>
          <div className="text-sm text-muted">
            Ten zestaw pozostaje aktywny we wszystkich kolejnych rundach.
          </div>
        </div>

        {categories.length ? (
          <>
            {!gameStarted ? (
              <div className="mb-3 text-xs font-medium text-muted">
                Przed startem gry możesz blokować wybrane kategorie przed ponownym losowaniem.
              </div>
            ) : (
              <div className="mb-3 text-xs font-medium text-muted">
                Po rozpoczęciu gry zmiana zestawu kategorii wymaga dodatkowego potwierdzenia.
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => {
                const meta = DIFFICULTY_META[category.difficulty];
                const isLocked = lockedCategoryIds.includes(category.id);

                return (
                  <div
                    key={category.id}
                    className={cx(
                      "flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm shadow-sm",
                      meta.accent,
                      meta.soft,
                    )}
                  >
                    <span className="font-semibold">{category.name}</span>
                    <CategoryInfoPopover category={category} align="right" />
                    <button
                      aria-label={`${isLocked ? "Odblokuj" : "Zablokuj"} kategorię ${category.name}`}
                      className={cx(
                        "rounded-full p-1 transition hover:bg-white/80",
                        gameStarted ? "cursor-not-allowed opacity-45" : "text-slate-500 hover:text-ink",
                      )}
                      disabled={gameStarted}
                      type="button"
                      onClick={() => onToggleCategoryLock(category.id)}
                    >
                      {isLocked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
                    </button>
                    <button
                      aria-label={`Losuj ponownie kategorię ${category.name}`}
                      className="rounded-full p-1 text-slate-500 transition hover:bg-white/80 hover:text-primary"
                      type="button"
                      onClick={() => onRerollCategory(category.id)}
                    >
                      <Sparkles className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-line bg-slate-50 px-4 py-5 text-sm text-muted">
            Po pierwszym losowaniu tutaj pojawi się wspólny zestaw kategorii dla całej gry.
          </div>
        )}
      </div>
    </Card>
  );
}
