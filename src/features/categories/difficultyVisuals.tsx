import type { LucideIcon } from "lucide-react";
import { Flame, Gem, ShieldCheck, Star, Target } from "lucide-react";
import type { Difficulty } from "@/features/categories/categoryTypes";

export const DIFFICULTY_ICONS: Record<Difficulty, LucideIcon> = {
  basic: ShieldCheck,
  classic: Star,
  medium: Target,
  hard: Flame,
  advanced: Gem,
};
