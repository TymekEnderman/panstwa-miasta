import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { DIFFICULTY_META, type Category } from "@/features/categories/categoryTypes";
import { cx } from "@/lib/cx";

type CategoryInfoPopoverProps = {
  category: Pick<Category, "name" | "difficulty" | "description" | "examples">;
  align?: "left" | "right";
};

type Position = {
  top: number;
  left: number;
};

const TOOLTIP_WIDTH = 304;
const VIEWPORT_GAP = 12;
const OFFSET = 10;

export function CategoryInfoPopover({
  category,
}: CategoryInfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const meta = DIFFICULTY_META[category.difficulty];

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimeout();
    closeTimeoutRef.current = window.setTimeout(() => setOpen(false), 120);
  };

  const updatePosition = () => {
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;

    if (!trigger || !tooltip) {
      return;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const tooltipHeight = tooltip.offsetHeight || 220;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = triggerRect.left + triggerRect.width / 2 - TOOLTIP_WIDTH / 2;
    left = Math.max(VIEWPORT_GAP, Math.min(left, viewportWidth - TOOLTIP_WIDTH - VIEWPORT_GAP));

    const shouldOpenAbove =
      triggerRect.bottom + OFFSET + tooltipHeight > viewportHeight - VIEWPORT_GAP &&
      triggerRect.top - OFFSET - tooltipHeight > VIEWPORT_GAP;

    const top = shouldOpenAbove
      ? triggerRect.top - tooltipHeight - OFFSET
      : triggerRect.bottom + OFFSET;

    setPosition({
      top: Math.max(VIEWPORT_GAP, Math.min(top, viewportHeight - tooltipHeight - VIEWPORT_GAP)),
      left,
    });
  };

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    updatePosition();
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleResize = () => updatePosition();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(
    () => () => {
      clearCloseTimeout();
    },
    [],
  );

  return (
    <>
      <button
        ref={triggerRef}
        aria-expanded={open}
        aria-label={`Pokaż informacje o kategorii ${category.name}`}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-muted transition hover:border-primary/25 hover:text-primary"
        type="button"
        onBlur={() => scheduleClose()}
        onClick={() => {
          clearCloseTimeout();
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onMouseEnter={() => {
          clearCloseTimeout();
          setOpen(true);
        }}
        onMouseLeave={() => scheduleClose()}
      >
        <Info className="h-4 w-4" />
      </button>

      {typeof document !== "undefined" && open
        ? createPortal(
            <motion.div
              ref={tooltipRef}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="fixed z-[90] w-[304px] max-w-[calc(100vw-24px)] rounded-3xl border border-line bg-white p-4 shadow-card"
              data-testid="category-info-tooltip"
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              role="tooltip"
              style={{
                top: position.top,
                left: position.left,
              }}
              transition={{ duration: 0.14 }}
              onMouseEnter={() => clearCloseTimeout()}
              onMouseLeave={() => scheduleClose()}
            >
              <div className="space-y-3 text-sm text-slate-700">
                <div>
                  <div className="text-base font-semibold text-ink">{category.name}</div>
                  <div
                    className={cx(
                      "mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                      meta.accent,
                      meta.soft,
                    )}
                  >
                    Poziom: {meta.label}
                  </div>
                </div>
                <p className="leading-6">{category.description}</p>
                <div>
                  <div className="mb-1 font-medium text-ink">Przykłady</div>
                  <div className="flex flex-wrap gap-2">
                    {category.examples.map((example) => (
                      <span
                        key={example}
                        className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>,
            document.body,
          )
        : null}
    </>
  );
}
