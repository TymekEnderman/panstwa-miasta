export type Difficulty =
  | "basic"
  | "classic"
  | "medium"
  | "hard"
  | "advanced";

export type Category = {
  id: string;
  name: string;
  difficulty: Difficulty;
  description: string;
  examples: string[];
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CategorySnapshot = {
  id: string;
  name: string;
  difficulty: Difficulty;
  description: string;
  examples: string[];
};

export type CategoryStatusFilter = "all" | "active" | "disabled";
export type CategorySortOrder = "az" | "za" | "newest" | "oldest";

export type CategoryFilters = {
  query: string;
  difficulty: "all" | Difficulty;
  status: CategoryStatusFilter;
  sort: CategorySortOrder;
};

export const DIFFICULTY_ORDER: Difficulty[] = [
  "basic",
  "classic",
  "medium",
  "hard",
  "advanced",
];

export const DIFFICULTY_META: Record<
  Difficulty,
  { label: string; accent: string; soft: string }
> = {
  basic: {
    label: "Podstawowe",
    accent: "text-difficulty-basic border-difficulty-basic/25",
    soft: "bg-difficulty-basic/8",
  },
  classic: {
    label: "Klasyczne",
    accent: "text-difficulty-classic border-difficulty-classic/25",
    soft: "bg-difficulty-classic/8",
  },
  medium: {
    label: "Średnie",
    accent: "text-difficulty-medium border-difficulty-medium/25",
    soft: "bg-difficulty-medium/8",
  },
  hard: {
    label: "Trudne",
    accent: "text-difficulty-hard border-difficulty-hard/25",
    soft: "bg-difficulty-hard/8",
  },
  advanced: {
    label: "Zaawansowane",
    accent: "text-difficulty-advanced border-difficulty-advanced/25",
    soft: "bg-difficulty-advanced/8",
  },
};
