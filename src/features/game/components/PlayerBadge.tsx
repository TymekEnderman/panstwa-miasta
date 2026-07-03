import type { Player } from "@/features/game/gameTypes";
import { getPlayerInitial, PLAYER_ACCENTS } from "@/features/game/gameUtils";
import { cx } from "@/lib/cx";

type PlayerBadgeProps = {
  player: Pick<Player, "name" | "colorIndex">;
  showName?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClassName = {
  sm: {
    avatar: "h-8 w-8 text-xs",
    name: "text-sm",
    gap: "gap-2",
  },
  md: {
    avatar: "h-9 w-9 text-sm",
    name: "text-base",
    gap: "gap-2.5",
  },
  lg: {
    avatar: "h-12 w-12 text-lg",
    name: "text-lg",
    gap: "gap-3",
  },
} as const;

export function PlayerBadge({
  player,
  showName = true,
  size = "md",
  className,
}: PlayerBadgeProps) {
  const accent = PLAYER_ACCENTS[player.colorIndex];
  const [textClassName, backgroundClassName, borderClassName] = accent.split(" ");
  const sizes = sizeClassName[size];

  return (
    <div className={cx("flex items-center", sizes.gap, className)}>
      <div
        className={cx(
          "flex items-center justify-center rounded-full border font-bold",
          textClassName,
          backgroundClassName,
          borderClassName,
          sizes.avatar,
        )}
      >
        {getPlayerInitial(player.name)}
      </div>
      {showName ? <span className={cx("font-semibold", textClassName, sizes.name)}>{player.name}</span> : null}
    </div>
  );
}
