import { useEffect, useMemo, useState } from "react";
import { Grid2x2, Plus, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { showToast } from "@/components/ui/toastStore";
import { CategoryBoard } from "@/features/categories/components/CategoryBoard";
import { CategoryFilters } from "@/features/categories/components/CategoryFilters";
import { CategoryForm } from "@/features/categories/components/CategoryForm";
import { useCategoryStore } from "@/features/categories/categoryStore";
import { filterCategories } from "@/features/categories/categoryUtils";
import type { Category, CategoryFilters as CategoryFiltersState } from "@/features/categories/categoryTypes";
import { useGameStore } from "@/features/game/gameStore";

const defaultFilters: CategoryFiltersState = {
  query: "",
  difficulty: "all",
  status: "all",
  sort: "az",
};

export function CategoriesPage() {
  const categories = useCategoryStore((state) => state.categories);
  const addCategory = useCategoryStore((state) => state.addCategory);
  const updateCategory = useCategoryStore((state) => state.updateCategory);
  const deleteCategory = useCategoryStore((state) => state.deleteCategory);
  const setCategoryActive = useCategoryStore((state) => state.setCategoryActive);
  const syncCategoryAvailability = useGameStore((state) => state.syncCategoryAvailability);
  const [filters, setFilters] = useState(defaultFilters);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [mobileFormOpen, setMobileFormOpen] = useState(false);

  const filteredCategories = useMemo(
    () => filterCategories(categories, filters),
    [categories, filters],
  );

  const activeCount = categories.filter((category) => category.isActive).length;

  useEffect(() => {
    syncCategoryAvailability(categories);
  }, [categories, syncCategoryAvailability]);

  return (
    <main className="app-shell">
      <div className="page-frame space-y-6">
        <header className="glass-card p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-white shadow-float">
                <Grid2x2 className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-ink">Baza kategorii</h1>
                <p className="mt-1 text-lg text-muted">
                  Zarządzaj kategoriami i ich poziomem trudności
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="inline-flex items-center justify-center rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                {activeCount} aktywne
              </div>
              <Link to="/game">
                <Button className="w-full sm:w-auto" size="lg" variant="secondary">
                  Powrót do panelu gry
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <Card>
          <CategoryFilters filters={filters} onChange={setFilters} />
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 xl:hidden">
              <div>
                <div className="text-lg font-semibold text-ink">Dodawanie kategorii</div>
                <div className="text-sm text-muted">Na telefonie formularz otwiera się w oknie.</div>
              </div>
              <Button variant="primary" onClick={() => setMobileFormOpen(true)}>
                <Plus className="h-4 w-4" />
                Dodaj
              </Button>
            </div>

            <CategoryBoard
              categories={filteredCategories}
              onDelete={setCategoryToDelete}
              onEdit={setEditingCategory}
              onToggle={(category) => {
                setCategoryActive(category.id, !category.isActive);
                showToast({
                  title: category.isActive
                    ? "Kategoria została wyłączona"
                    : "Kategoria została włączona",
                  description: category.name,
                  tone: "success",
                });
              }}
            />
          </div>

          <aside className="hidden xl:block">
            <div className="sticky top-6 space-y-4">
              <Card title="Dodaj nową kategorię">
                <CategoryForm
                  categories={categories}
                  submitLabel="Dodaj kategorię"
                  onSubmit={(values) => {
                    const created = addCategory(values);
                    showToast({
                      title: "Kategoria została dodana",
                      description: created.name,
                      tone: "success",
                    });
                  }}
                />
              </Card>

              <Card>
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-ink">Wskazówka</div>
                    <p className="mt-1 text-sm leading-6 text-muted">
                      Kliknij ikonę informacji przy kategorii, aby zobaczyć opis i przykłady bez
                      przechodzenia do edycji.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </aside>
        </div>
      </div>

      <Modal
        open={mobileFormOpen}
        title="Dodaj nową kategorię"
        onClose={() => setMobileFormOpen(false)}
      >
        <CategoryForm
          categories={categories}
          submitLabel="Dodaj kategorię"
          onSubmit={(values) => {
            const created = addCategory(values);
            setMobileFormOpen(false);
            showToast({
              title: "Kategoria została dodana",
              description: created.name,
              tone: "success",
            });
          }}
        />
      </Modal>

      <Modal
        open={Boolean(editingCategory)}
        title="Edytuj kategorię"
        onClose={() => setEditingCategory(null)}
      >
        {editingCategory ? (
          <CategoryForm
            categories={categories}
            editingCategoryId={editingCategory.id}
            initialValues={{
              name: editingCategory.name,
              difficulty: editingCategory.difficulty,
              description: editingCategory.description,
              examplesText: editingCategory.examples.join(", "),
              isActive: editingCategory.isActive,
            }}
            submitLabel="Zapisz zmiany"
            onSubmit={(values) => {
              updateCategory(editingCategory.id, values);
              setEditingCategory(null);
              showToast({
                title: "Kategoria została zaktualizowana",
                description: values.name,
                tone: "success",
              });
            }}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        cancelLabel="Anuluj"
        confirmLabel="Usuń kategorię"
        description={
          categoryToDelete
            ? `Kategoria "${categoryToDelete.name}" zniknie z bieżącej bazy, ale pozostanie zapisana w historii starszych rund.`
            : ""
        }
        open={Boolean(categoryToDelete)}
        title="Usunąć kategorię?"
        tone="danger"
        onClose={() => setCategoryToDelete(null)}
        onConfirm={() => {
          if (!categoryToDelete) {
            return;
          }

          deleteCategory(categoryToDelete.id);
          showToast({
            title: "Kategoria została usunięta",
            description: categoryToDelete.name,
            tone: "success",
          });
          setCategoryToDelete(null);
        }}
      />
    </main>
  );
}
