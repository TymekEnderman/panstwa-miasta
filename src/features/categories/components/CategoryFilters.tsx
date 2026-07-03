import { Search } from "lucide-react";
import type {
  CategoryFilters as CategoryFiltersState,
  CategorySortOrder,
  CategoryStatusFilter,
  Difficulty,
} from "@/features/categories/categoryTypes";
import { DIFFICULTY_META } from "@/features/categories/categoryTypes";

type CategoryFiltersProps = {
  filters: CategoryFiltersState;
  onChange: (nextFilters: CategoryFiltersState) => void;
};

type SelectOption = {
  value: string;
  label: string;
};

const difficultyOptions: SelectOption[] = [
  { value: "all", label: "Wszystkie tagi" },
  ...Object.entries(DIFFICULTY_META).map(([value, meta]) => ({
    value,
    label: meta.label,
  })),
];

const statusOptions: SelectOption[] = [
  { value: "all", label: "Wszystkie statusy" },
  { value: "active", label: "Aktywne" },
  { value: "disabled", label: "Wyłączone" },
];

const sortOptions: SelectOption[] = [
  { value: "az", label: "Sortuj: A-Z" },
  { value: "za", label: "Sortuj: Z-A" },
  { value: "newest", label: "Sortuj: najnowsze" },
  { value: "oldest", label: "Sortuj: najstarsze" },
];

export function CategoryFilters({ filters, onChange }: CategoryFiltersProps) {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)_minmax(220px,1fr)_minmax(220px,1fr)]">
      <label className="relative block">
        <span className="sr-only">Szukaj kategorii</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          className="min-h-12 w-full rounded-2xl border border-line bg-white pl-12 pr-4 text-[15px] text-ink placeholder:text-slate-400"
          placeholder="Szukaj kategorii..."
          value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
        />
      </label>

      <SelectField
        label="Filtr poziomu trudności"
        options={difficultyOptions}
        value={filters.difficulty}
        onChange={(value) =>
          onChange({
            ...filters,
            difficulty: value as "all" | Difficulty,
          })
        }
      />

      <SelectField
        label="Filtr statusu"
        options={statusOptions}
        value={filters.status}
        onChange={(value) =>
          onChange({
            ...filters,
            status: value as CategoryStatusFilter,
          })
        }
      />

      <SelectField
        label="Sortowanie"
        options={sortOptions}
        value={filters.sort}
        onChange={(value) =>
          onChange({
            ...filters,
            sort: value as CategorySortOrder,
          })
        }
      />
    </div>
  );
}

function SelectField({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        className="min-h-12 w-full rounded-2xl border border-line bg-white px-4 text-[15px] text-ink"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
