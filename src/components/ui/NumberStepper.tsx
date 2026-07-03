import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cx } from "@/lib/cx";

type NumberStepperProps = {
  label: string;
  value: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  compact?: boolean;
};

export function NumberStepper({
  label,
  value,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  disabled,
  onChange,
  compact = false,
}: NumberStepperProps) {
  const canDecrease = !disabled && value > min;
  const canIncrease = !disabled && value < max;

  return (
    <div className={cx("space-y-2", compact && "space-y-1")}>
      <div className="text-sm font-medium text-slate-700">{label}</div>
      <div className="flex items-center gap-2">
        <Button
          aria-label={`Zmniejsz wartość pola ${label}`}
          className="h-10 w-10 rounded-2xl p-0"
          disabled={!canDecrease}
          variant="secondary"
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <div className="flex min-h-10 min-w-[54px] items-center justify-center rounded-2xl border border-line bg-white px-3 text-base font-semibold text-ink">
          {value}
        </div>
        <Button
          aria-label={`Zwiększ wartość pola ${label}`}
          className="h-10 w-10 rounded-2xl p-0"
          disabled={!canIncrease}
          variant="secondary"
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
