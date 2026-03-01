import type { Meal } from "@/lib/utils/meal";

export const MEALS: Meal[] = ["breakfast", "lunch", "dinner", "snack"];

export const mealColors: Record<
  Meal,
  { bg: string; text: string; ring: string; hover: string; border: string; muted: string }
> = {
  breakfast: { bg: "bg-sky-100 dark:bg-sky-900/30", text: "text-sky-800 dark:text-sky-100", ring: "ring-sky-300/60 dark:ring-sky-500/40", hover: "hover:bg-sky-200 dark:hover:bg-sky-900/50", border: "border-sky-300/70 dark:border-sky-700/70", muted: "text-sky-700 dark:text-sky-200" },
  lunch:     { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-800 dark:text-emerald-100", ring: "ring-emerald-300/60 dark:ring-emerald-500/40", hover: "hover:bg-emerald-200 dark:hover:bg-emerald-900/50", border: "border-emerald-300/70 dark:border-emerald-700/70", muted: "text-emerald-700 dark:text-emerald-200" },
  dinner:    { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-800 dark:text-indigo-100", ring: "ring-indigo-300/60 dark:ring-indigo-500/40", hover: "hover:bg-indigo-200 dark:hover:bg-indigo-900/50", border: "border-indigo-300/70 dark:border-indigo-700/70", muted: "text-indigo-700 dark:text-indigo-200" },
  snack:     { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-800 dark:text-amber-100", ring: "ring-amber-300/60 dark:ring-amber-500/40", hover: "hover:bg-amber-200 dark:hover:bg-amber-900/50", border: "border-amber-300/70 dark:border-amber-700/70", muted: "text-amber-700 dark:text-amber-200" },
};