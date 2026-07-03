import { DEFAULT_CATEGORIES } from "@/features/categories/defaultCategories";
import { validateCategoryForm, validatePlayerName } from "@/lib/validation";

describe("validation", () => {
  it("waliduje nazwę gracza", () => {
    expect(validatePlayerName("", ["Gracz 1"])).toBe("Nazwa gracza jest wymagana.");
    expect(validatePlayerName("Gracz 1", ["Gracz 1"])).toBe(
      "Gracz o tej nazwie już istnieje.",
    );
    expect(validatePlayerName("Nowy gracz", ["Gracz 1"])).toBeNull();
  });

  it("waliduje formularz kategorii", () => {
    const duplicateError = validateCategoryForm(
      {
        name: "Państwo",
        difficulty: "basic",
        description: "Opis",
        examplesText: "Polska, Peru",
        isActive: true,
      },
      DEFAULT_CATEGORIES,
    );

    expect(duplicateError?.field).toBe("name");

    const valid = validateCategoryForm(
      {
        name: "Mitologia",
        difficulty: "advanced",
        description: "Bohaterowie i bóstwa mitologiczne.",
        examplesText: "Zeus, Hera, Atena",
        isActive: true,
      },
      DEFAULT_CATEGORIES,
    );

    expect(valid).toBeNull();
  });
});
