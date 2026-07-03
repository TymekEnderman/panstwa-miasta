import { EmptyState } from "@/components/ui/EmptyState";
import { DIFFICULTY_ICONS } from "@/features/categories/difficultyVisuals";
import { DIFFICULTY_META, type Category, type Difficulty } from "@/features/categories/categoryTypes";
import { CategoryItem } from "@/features/categories/components/CategoryItem";
import { cx } from "@/lib/cx";
import { formatCategoryCount } from "@/lib/pluralization";

type CategoryColumnProps = {
  difficulty: Difficulty;
  categories: Category[];
  onEdit: (category: Category) => void;
  onToggle: (category: Category) => void;
  onDelete: (category: Category) => void;
};

export function CategoryColumn({
  difficulty,
  categories,
  onEdit,
  onToggle,
  onDelete,
}: CategoryColumnProps) {
  const meta = DIFFICULTY_META[difficulty];
  const Icon = DIFFICULTY_ICONS[difficulty];

  return (
    <div className="glass-card flex min-h-[420px] flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cx("rounded-2xl p-2", meta.soft)}>
            <Icon className={cx("h-5 w-5", meta.accent.split(" ")[0])} />
          </div>
          <div>
            <div className="text-lg font-semibold text-ink">{meta.label}</div>
            <div className="text-sm text-muted">{formatCategoryCount(categories.length)}</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {categories.length ? (
          categories.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              onDelete={onDelete}
              onEdit={onEdit}
              onToggle={onToggle}
            />
          ))
        ) : (
          <EmptyState
            title="Brak kategorii"
            description="W tej sekcji nie ma jeszcze kategorii spełniających aktualne filtry."
          />
        )}
      </div>
    </div>
  );
}
