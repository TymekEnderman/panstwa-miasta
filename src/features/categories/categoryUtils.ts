import { createId } from "@/lib/ids";
import { normalizeWhitespace } from "@/lib/validation";
import type {
  Category,
  CategoryFilters,
  CategorySnapshot,
  CategorySortOrder,
  Difficulty,
} from "@/features/categories/categoryTypes";

export function sortCategories(categories: Category[], order: CategorySortOrder) {
  const sorted = [...categories];

  sorted.sort((left, right) => {
    if (order === "az") {
      return left.name.localeCompare(right.name, "pl");
    }

    if (order === "za") {
      return right.name.localeCompare(left.name, "pl");
    }

    if (order === "newest") {
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    }

    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  });

  return sorted;
}

export function filterCategories(categories: Category[], filters: CategoryFilters) {
  const normalizedQuery = normalizeWhitespace(filters.query).toLocaleLowerCase("pl-PL");

  return sortCategories(
    categories.filter((category) => {
      const matchesQuery =
        !normalizedQuery ||
        category.name.toLocaleLowerCase("pl-PL").includes(normalizedQuery) ||
        category.description.toLocaleLowerCase("pl-PL").includes(normalizedQuery) ||
        category.examples.some((example) =>
          example.toLocaleLowerCase("pl-PL").includes(normalizedQuery),
        );

      const matchesDifficulty =
        filters.difficulty === "all" || category.difficulty === filters.difficulty;

      const matchesStatus =
        filters.status === "all" ||
        (filters.status === "active" ? category.isActive : !category.isActive);

      return matchesQuery && matchesDifficulty && matchesStatus;
    }),
    filters.sort,
  );
}

export function createCategorySnapshot(category: Category): CategorySnapshot {
  return {
    id: category.id,
    name: category.name,
    difficulty: category.difficulty,
    description: category.description,
    examples: [...category.examples],
  };
}

export function createCustomCategory(input: {
  name: string;
  difficulty: Difficulty;
  description: string;
  examples: string[];
  isActive: boolean;
}) {
  const timestamp = new Date().toISOString();

  return {
    id: createId(),
    name: normalizeWhitespace(input.name),
    difficulty: input.difficulty,
    description: input.description.trim(),
    examples: input.examples.map((example) => normalizeWhitespace(example)),
    isActive: input.isActive,
    isDefault: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  } satisfies Category;
}

export function groupCategoriesByDifficulty(categories: Category[]) {
  return categories.reduce<Record<Difficulty, Category[]>>(
    (groups, category) => {
      groups[category.difficulty].push(category);
      return groups;
    },
    {
      basic: [],
      classic: [],
      medium: [],
      hard: [],
      advanced: [],
    },
  );
}

export function getActiveCategoryCounts(categories: Category[]) {
  return categories.reduce<Record<Difficulty, number>>(
    (counts, category) => {
      if (category.isActive) {
        counts[category.difficulty] += 1;
      }
      return counts;
    },
    {
      basic: 0,
      classic: 0,
      medium: 0,
      hard: 0,
      advanced: 0,
    },
  );
}
