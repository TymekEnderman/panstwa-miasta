import { create } from "zustand";
import { DEFAULT_CATEGORIES } from "@/features/categories/defaultCategories";
import type { Category, Difficulty } from "@/features/categories/categoryTypes";
import { createCustomCategory } from "@/features/categories/categoryUtils";
import { STORAGE_KEYS, loadVersionedValue, saveVersionedValue } from "@/lib/storage";
import { normalizeWhitespace } from "@/lib/validation";

type CategoryCreateInput = {
  name: string;
  difficulty: Difficulty;
  description: string;
  examples: string[];
  isActive: boolean;
};

type CategoryUpdateInput = {
  name: string;
  difficulty: Difficulty;
  description: string;
  examples: string[];
  isActive: boolean;
};

type CategoryStore = {
  categories: Category[];
  addCategory: (input: CategoryCreateInput) => Category;
  updateCategory: (categoryId: string, input: CategoryUpdateInput) => void;
  deleteCategory: (categoryId: string) => void;
  setCategoryActive: (categoryId: string, isActive: boolean) => void;
};

const initialCategories = loadVersionedValue(STORAGE_KEYS.categories, DEFAULT_CATEGORIES);

export const useCategoryStore = create<CategoryStore>((set) => ({
  categories: initialCategories,
  addCategory: (input) => {
    const category = createCustomCategory(input);
    set((state) => ({
      categories: [...state.categories, category],
    }));
    return category;
  },
  updateCategory: (categoryId, input) =>
    set((state) => ({
      categories: state.categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              name: normalizeWhitespace(input.name),
              difficulty: input.difficulty,
              description: input.description.trim(),
              examples: input.examples.map((example) => normalizeWhitespace(example)),
              isActive: input.isActive,
              updatedAt: new Date().toISOString(),
            }
          : category,
      ),
    })),
  deleteCategory: (categoryId) =>
    set((state) => ({
      categories: state.categories.filter((category) => category.id !== categoryId),
    })),
  setCategoryActive: (categoryId, isActive) =>
    set((state) => ({
      categories: state.categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              isActive,
              updatedAt: new Date().toISOString(),
            }
          : category,
      ),
    })),
}));

useCategoryStore.subscribe((state) => {
  saveVersionedValue(STORAGE_KEYS.categories, state.categories);
});

export function getCategoryStoreSnapshot() {
  return useCategoryStore.getState().categories;
}
