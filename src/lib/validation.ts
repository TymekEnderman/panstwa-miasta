import type { Category } from "@/features/categories/categoryTypes";

export type CategoryFormValues = {
  name: string;
  difficulty: string;
  description: string;
  examplesText: string;
  isActive: boolean;
};

export function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function parseExamplesText(value: string) {
  return value
    .split(/[\n,]+/)
    .map((item) => normalizeWhitespace(item))
    .filter(Boolean);
}

export function validatePlayerName(
  value: string,
  existingNames: string[],
  currentName?: string,
) {
  const normalized = normalizeWhitespace(value);

  if (!normalized) {
    return "Nazwa gracza jest wymagana.";
  }

  if (normalized.length < 1) {
    return "Nazwa gracza jest wymagana.";
  }

  if (normalized.length > 30) {
    return "Nazwa gracza może mieć maksymalnie 30 znaków.";
  }

  const normalizedSet = new Set(
    existingNames
      .filter((name) => name !== currentName)
      .map((name) => normalizeWhitespace(name).toLocaleLowerCase("pl-PL")),
  );

  if (normalizedSet.has(normalized.toLocaleLowerCase("pl-PL"))) {
    return "Gracz o tej nazwie już istnieje.";
  }

  return null;
}

export function validateScore(value: number) {
  if (!Number.isInteger(value)) {
    return "Punkty muszą być liczbą całkowitą.";
  }

  if (value < 0 || value > 999) {
    return "Punkty muszą mieścić się w zakresie od 0 do 999.";
  }

  return null;
}

export function validateCategoryForm(
  values: CategoryFormValues,
  categories: Category[],
  editingCategoryId?: string,
) {
  const normalizedName = normalizeWhitespace(values.name);
  const description = values.description.trim();
  const examples = parseExamplesText(values.examplesText);

  if (normalizedName.length < 2 || normalizedName.length > 60) {
    return {
      field: "name" as const,
      message: "Nazwa kategorii musi mieć od 2 do 60 znaków.",
    };
  }

  if (!values.difficulty) {
    return {
      field: "difficulty" as const,
      message: "Wybierz poziom trudności.",
    };
  }

  if (description.length > 400) {
    return {
      field: "description" as const,
      message: "Opis może mieć maksymalnie 400 znaków.",
    };
  }

  const duplicate = categories.find((category) => {
    if (category.id === editingCategoryId) {
      return false;
    }

    return (
      normalizeWhitespace(category.name).toLocaleLowerCase("pl-PL") ===
      normalizedName.toLocaleLowerCase("pl-PL")
    );
  });

  if (duplicate) {
    return {
      field: "name" as const,
      message: "Kategoria o tej nazwie już istnieje.",
    };
  }

  if (examples.length < 2) {
    return {
      field: "examplesText" as const,
      message: "Dodaj co najmniej 2 przykłady, oddzielając je przecinkami lub Enterem.",
    };
  }

  return null;
}
