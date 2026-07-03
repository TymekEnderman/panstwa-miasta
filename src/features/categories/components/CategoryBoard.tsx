import { DIFFICULTY_ORDER, type Category, type Difficulty } from "@/features/categories/categoryTypes";
import { CategoryColumn } from "@/features/categories/components/CategoryColumn";
import { groupCategoriesByDifficulty } from "@/features/categories/categoryUtils";

type CategoryBoardProps = {
  categories: Category[];
  onEdit: (category: Category) => void;
  onToggle: (category: Category) => void;
  onDelete: (category: Category) => void;
};

export function CategoryBoard({
  categories,
  onEdit,
  onToggle,
  onDelete,
}: CategoryBoardProps) {
  const grouped = groupCategoriesByDifficulty(categories);

  return (
    <div className="grid gap-4 xl:grid-cols-5">
      {DIFFICULTY_ORDER.map((difficulty) => (
        <CategoryColumn
          key={difficulty}
          categories={grouped[difficulty as Difficulty]}
          difficulty={difficulty}
          onDelete={onDelete}
          onEdit={onEdit}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}
