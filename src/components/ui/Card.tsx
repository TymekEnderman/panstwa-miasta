import type { HTMLAttributes, PropsWithChildren } from "react";
import { cx } from "@/lib/cx";

type CardProps = PropsWithChildren<
  HTMLAttributes<HTMLDivElement> & {
    title?: string;
    subtitle?: string;
    headerAction?: React.ReactNode;
  }
>;

export function Card({
  children,
  className,
  title,
  subtitle,
  headerAction,
  ...props
}: CardProps) {
  return (
    <section className={cx("glass-card p-5 sm:p-6", className)} {...props}>
      {title || subtitle || headerAction ? (
        <header className="mb-5 flex items-start justify-between gap-3">
          <div>
            {title ? <h2 className="text-xl font-semibold text-ink">{title}</h2> : null}
            {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
          </div>
          {headerAction}
        </header>
      ) : null}
      {children}
    </section>
  );
}
