import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CategoryInfoPopover } from "@/features/categories/components/CategoryInfoPopover";
import { DIFFICULTY_META, type Category } from "@/features/categories/categoryTypes";
import { cx } from "@/lib/cx";

type CategoryItemProps = {
  category: Category;
  onEdit: (category: Category) => void;
  onToggle: (category: Category) => void;
  onDelete: (category: Category) => void;
};

type MenuPosition = {
  top: number;
  left: number;
};

const MENU_WIDTH = 176;
const VIEWPORT_GAP = 12;

export function CategoryItem({
  category,
  onEdit,
  onToggle,
  onDelete,
}: CategoryItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const meta = DIFFICULTY_META[category.difficulty];

  const updateMenuPosition = () => {
    const button = buttonRef.current;
    const menu = menuRef.current;

    if (!button || !menu) {
      return;
    }

    const buttonRect = button.getBoundingClientRect();
    const menuHeight = menu.offsetHeight || 132;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = buttonRect.right - MENU_WIDTH;
    left = Math.max(VIEWPORT_GAP, Math.min(left, viewportWidth - MENU_WIDTH - VIEWPORT_GAP));

    let top = buttonRect.bottom + 10;
    if (top + menuHeight > viewportHeight - VIEWPORT_GAP) {
      top = buttonRect.top - menuHeight - 10;
    }

    setMenuPosition({
      top: Math.max(VIEWPORT_GAP, top),
      left,
    });
  };

  useLayoutEffect(() => {
    if (menuOpen) {
      updateMenuPosition();
    }
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) {
        return;
      }

      setMenuOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    const handleReposition = () => updateMenuPosition();

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [menuOpen]);

  return (
    <div
      className={cx(
        "rounded-3xl border bg-white px-3 py-3 transition",
        meta.accent,
        category.isActive ? meta.soft : "opacity-65",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold text-ink">{category.name}</div>
          <div className="mt-1 text-xs text-muted">
            {category.isActive ? "Aktywna" : "Wyłączona"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CategoryInfoPopover category={category} />

          <Button
            ref={buttonRef}
            aria-expanded={menuOpen}
            aria-label={`Otwórz menu działań dla kategorii ${category.name}`}
            className="h-8 w-8 rounded-full p-0"
            variant="ghost"
            onClick={() => setMenuOpen((value) => !value)}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {typeof document !== "undefined"
        ? createPortal(
            menuOpen ? (
              <div
                ref={menuRef}
                data-testid="category-actions-menu"
                className="fixed z-[95] w-44 rounded-2xl border border-line bg-white p-2 shadow-card"
                style={{
                  top: menuPosition.top,
                  left: menuPosition.left,
                }}
              >
                <MenuButton
                  icon={<Pencil className="h-4 w-4" />}
                  label="Edytuj"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(category);
                  }}
                />
                <MenuButton
                  icon={<Power className="h-4 w-4" />}
                  label={category.isActive ? "Wyłącz" : "Włącz"}
                  onClick={() => {
                    setMenuOpen(false);
                    onToggle(category);
                  }}
                />
                <MenuButton
                  className="text-rose-600"
                  icon={<Trash2 className="h-4 w-4" />}
                  label="Usuń"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(category);
                  }}
                />
              </div>
            ) : null,
            document.body,
          )
        : null}
    </div>
  );
}

function MenuButton({
  icon,
  label,
  className,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  className?: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cx(
        "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50",
        className,
      )}
      type="button"
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}
