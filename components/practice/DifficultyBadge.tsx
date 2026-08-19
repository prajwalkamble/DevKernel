import clsx from "clsx";
import { DIFFICULTY_BADGE_CLASS, DIFFICULTY_LABEL, type Difficulty } from "@/content/practice";

export function DifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: Difficulty;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-block shrink-0 rounded px-2 py-0.5 text-xs font-semibold",
        DIFFICULTY_BADGE_CLASS[difficulty],
        className
      )}
    >
      {DIFFICULTY_LABEL[difficulty]}
    </span>
  );
}
