export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  assigned: "Assigned",
  on_the_way: "On the way",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  available: "Available",
  on_job: "On job",
  off_shift: "Off shift",
};

export const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20",
  assigned: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/20",
  on_the_way: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/20",
  in_progress: "bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-500/20",
  completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  cancelled: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/20",
  available: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  on_job: "bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-500/20",
  off_shift: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300 border-zinc-500/20",
};

export const PIPELINE = [
  "pending",
  "assigned",
  "on_the_way",
  "in_progress",
  "completed",
] as const;
