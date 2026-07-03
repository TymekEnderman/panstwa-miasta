import { cx } from "@/lib/cx";

type LetterHistoryProps = {
  label: string;
  letters: string[];
  variant?: "default" | "used";
};

export function LetterHistory({
  label,
  letters,
  variant = "default",
}: LetterHistoryProps) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-slate-700">{label}</div>
      <div className="flex flex-wrap gap-2">
        {letters.length ? (
          letters.map((letter, index) => (
            <span
              key={`${letter}-${index}`}
              className={cx(
                "inline-flex min-h-9 min-w-9 items-center justify-center rounded-xl border px-2.5 text-sm font-semibold",
                variant === "used"
                  ? "border-slate-200 bg-slate-100 text-slate-500"
                  : "border-line bg-white text-ink",
              )}
            >
              {letter}
            </span>
          ))
        ) : (
          <span className="text-sm text-muted">Brak</span>
        )}
      </div>
    </div>
  );
}
