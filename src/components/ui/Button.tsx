import { forwardRef, type ButtonHTMLAttributes, type PropsWithChildren } from "react";
import { LoaderCircle } from "lucide-react";
import { cx } from "@/lib/cx";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "soft";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    fullWidth?: boolean;
  }
>;

const variantClassName: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white shadow-float hover:bg-primary/95 active:bg-primary/90 disabled:bg-primary/40",
  secondary:
    "border border-line bg-white text-ink hover:border-primary/30 hover:bg-slate-50 active:bg-slate-100",
  ghost: "text-slate-700 hover:bg-slate-100 active:bg-slate-200",
  danger:
    "bg-danger text-white hover:bg-danger/95 active:bg-danger/90 disabled:bg-danger/40",
  soft: "bg-primary/10 text-primary hover:bg-primary/15 active:bg-primary/20",
};

const sizeClassName: Record<ButtonSize, string> = {
  sm: "min-h-10 px-3 text-sm",
  md: "min-h-11 px-4 text-sm sm:text-[15px]",
  lg: "min-h-12 px-5 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    className,
    variant = "secondary",
    size = "md",
    loading = false,
    fullWidth = false,
    disabled,
    type = "button",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition duration-200",
        "disabled:cursor-not-allowed disabled:shadow-none",
        variantClassName[variant],
        sizeClassName[size],
        fullWidth && "w-full",
        className,
      )}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
});
