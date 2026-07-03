import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryInfoPopover } from "@/features/categories/components/CategoryInfoPopover";
import { DEFAULT_CATEGORIES } from "@/features/categories/defaultCategories";

describe("CategoryInfoPopover", () => {
  it("renderuje tooltip w portalu", async () => {
    const user = userEvent.setup();

    render(<CategoryInfoPopover category={DEFAULT_CATEGORIES[0]!} />);

    await user.click(screen.getByRole("button", { name: /pokaż informacje o kategorii/i }));

    expect(screen.getByTestId("category-info-tooltip")).toBeInTheDocument();
    expect(screen.getByText(DEFAULT_CATEGORIES[0]!.description)).toBeInTheDocument();
  });
});
