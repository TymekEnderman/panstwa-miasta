import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { useToastStore } from "@/components/ui/toastStore";
import { cx } from "@/lib/cx";

const toneMap = {
  info: {
    icon: Info,
    className: "border-primary/20 bg-white text-ink",
  },
  success: {
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  warning: {
    icon: TriangleAlert,
    className: "border-amber-200 bg-amber-50 text-amber-950",
  },
  error: {
    icon: AlertCircle,
    className: "border-rose-200 bg-rose-50 text-rose-950",
  },
} as const;

export function ToastViewport() {
  const items = useToastStore((state) => state.items);
  const remove = useToastStore((state) => state.remove);

  useEffect(() => {
    if (!items.length) {
      return;
    }

    const timers = items.map((item) =>
      window.setTimeout(() => {
        remove(item.id);
      }, 4000),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [items, remove]);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3">
      <AnimatePresence initial={false}>
        {items.map((item) => {
          const tone = toneMap[item.tone];
          const Icon = tone.icon;

          return (
            <motion.div
              key={item.id}
              className={cx(
                "pointer-events-auto rounded-3xl border px-4 py-3 shadow-card",
                tone.className,
              )}
              initial={{ opacity: 0, x: 24, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 18, scale: 0.98 }}
              transition={{ duration: 0.16 }}
            >
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{item.title}</div>
                  {item.description ? (
                    <div className="mt-1 text-sm leading-5 opacity-80">{item.description}</div>
                  ) : null}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
