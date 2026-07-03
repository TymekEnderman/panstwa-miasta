import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Category, Difficulty } from "@/features/categories/categoryTypes";
import { DIFFICULTY_META } from "@/features/categories/categoryTypes";
import type { CategoryFormValues } from "@/lib/validation";
import { parseExamplesText, validateCategoryForm } from "@/lib/validation";

type CategoryFormProps = {
  categories: Category[];
  initialValues?: CategoryFormValues;
  editingCategoryId?: string;
  submitLabel: string;
  title?: string;
  onSubmit: (values: {
    name: string;
    difficulty: Difficulty;
    description: string;
    examples: string[];
    isActive: boolean;
  }) => void;
};

const DEFAULT_VALUES: CategoryFormValues = {
  name: "",
  difficulty: "",
  description: "",
  examplesText: "",
  isActive: true,
};

export function CategoryForm({
  categories,
  initialValues = DEFAULT_VALUES,
  editingCategoryId,
  submitLabel,
  title,
  onSubmit,
}: CategoryFormProps) {
  const [values, setValues] = useState<CategoryFormValues>(initialValues);
  const [errorField, setErrorField] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const difficultyOptions = useMemo(
    () =>
      Object.entries(DIFFICULTY_META).map(([value, meta]) => ({
        value,
        label: meta.label,
      })),
    [],
  );

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const validation = validateCategoryForm(values, categories, editingCategoryId);

        if (validation) {
          setErrorField(validation.field);
          setErrorMessage(validation.message);
          return;
        }

        setErrorField(null);
        setErrorMessage(null);

        onSubmit({
          name: values.name,
          difficulty: values.difficulty as Difficulty,
          description: values.description,
          examples: parseExamplesText(values.examplesText),
          isActive: values.isActive,
        });

        if (!editingCategoryId) {
          setValues(DEFAULT_VALUES);
        }
      }}
    >
      {title ? <h3 className="text-2xl font-semibold text-ink">{title}</h3> : null}

      <Field label="Nazwa kategorii" error={errorField === "name" ? errorMessage : null}>
        <input
          aria-label="Nazwa kategorii"
          className="min-h-12 w-full rounded-2xl border border-line bg-white px-4 text-[15px] text-ink"
          placeholder="np. Mitologia"
          value={values.name}
          onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
        />
      </Field>

      <Field
        label="Tag / poziom trudności"
        error={errorField === "difficulty" ? errorMessage : null}
      >
        <select
          aria-label="Tag / poziom trudności"
          className="min-h-12 w-full rounded-2xl border border-line bg-white px-4 text-[15px] text-ink"
          value={values.difficulty}
          onChange={(event) =>
            setValues((current) => ({ ...current, difficulty: event.target.value }))
          }
        >
          <option value="">Wybierz tag</option>
          {difficultyOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Opis / przykłady" error={errorField === "description" ? errorMessage : null}>
        <textarea
          aria-label="Opis / przykłady"
          className="min-h-[144px] w-full rounded-2xl border border-line bg-white px-4 py-3 text-[15px] text-ink"
          maxLength={400}
          placeholder="Opisz kategorię i podaj przykłady, oddzielając je przecinkami lub Enterem."
          value={values.description}
          onChange={(event) =>
            setValues((current) => ({ ...current, description: event.target.value }))
          }
        />
        <div className="mt-1 text-right text-xs text-muted">
          {values.description.length} / 400
        </div>
      </Field>

      <Field
        label="Przykłady odpowiedzi"
        error={errorField === "examplesText" ? errorMessage : null}
      >
        <textarea
          aria-label="Przykłady odpowiedzi"
          className="min-h-[120px] w-full rounded-2xl border border-line bg-white px-4 py-3 text-[15px] text-ink"
          placeholder="np. Zeus, Hera, Hades"
          value={values.examplesText}
          onChange={(event) =>
            setValues((current) => ({ ...current, examplesText: event.target.value }))
          }
        />
      </Field>

      <label className="flex items-center gap-3 rounded-2xl border border-line bg-slate-50 px-4 py-3">
        <input
          aria-label="Kategoria aktywna"
          checked={values.isActive}
          className="h-4 w-4 accent-primary"
          type="checkbox"
          onChange={(event) =>
            setValues((current) => ({ ...current, isActive: event.target.checked }))
          }
        />
        <span className="text-sm font-medium text-ink">Kategoria aktywna</span>
      </label>

      {errorField && errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <Button fullWidth type="submit" variant="primary">
        {submitLabel}
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error: string | null;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-medium text-slate-700">{label}</div>
      {children}
      {error ? <div className="mt-2 text-sm text-rose-600">{error}</div> : null}
    </label>
  );
}
