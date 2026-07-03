import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryForm } from "@/features/categories/components/CategoryForm";
import { DEFAULT_CATEGORIES } from "@/features/categories/defaultCategories";

describe("CategoryForm", () => {
  it("pokazuje błąd dla duplikatu i wysyła poprawne dane", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <CategoryForm
        categories={DEFAULT_CATEGORIES}
        submitLabel="Dodaj kategorię"
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText("Nazwa kategorii"), "Państwo");
    await user.selectOptions(screen.getByLabelText("Tag / poziom trudności"), "basic");
    await user.type(screen.getByLabelText("Opis / przykłady"), "Opis testowy");
    await user.type(screen.getByLabelText("Przykłady odpowiedzi"), "Polska, Peru");
    await user.click(screen.getByRole("button", { name: "Dodaj kategorię" }));

    expect(screen.getAllByText("Kategoria o tej nazwie już istnieje.")).toHaveLength(2);
    expect(onSubmit).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText("Nazwa kategorii"));
    await user.type(screen.getByLabelText("Nazwa kategorii"), "Mitologia");
    await user.selectOptions(screen.getByLabelText("Tag / poziom trudności"), "advanced");
    await user.clear(screen.getByLabelText("Przykłady odpowiedzi"));
    await user.type(screen.getByLabelText("Przykłady odpowiedzi"), "Zeus, Hera, Atena");
    await user.click(screen.getByRole("button", { name: "Dodaj kategorię" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Mitologia",
        difficulty: "advanced",
        examples: ["Zeus", "Hera", "Atena"],
      }),
    );
  });
});
