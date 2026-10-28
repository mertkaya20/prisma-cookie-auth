import type { TaskStatus } from "./types";

export const statusOrder: TaskStatus[] = ["todo", "in_progress", "done"];


export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

const shortDate = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });

export function formatShortDate(iso: string) {
  return shortDate.format(new Date(iso));
}

// Son tarih bugünden önceyse ve görev bitmediyse gecikmiş.
export function isOverdue(dueDate: string | null, status: TaskStatus) {
  if (!dueDate || status === "done") return false;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return new Date(dueDate) < startOfToday;
}
