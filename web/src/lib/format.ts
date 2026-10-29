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

/*
 * Son tarih bir gün (saat yok). API onu UTC gece yarısı olarak saklıyor: "2026-11-12T00:00:00.000Z".
 * Yerel saate çevrilirse UTC'nin gerisindeki ülkelerde bir gün önce görünür; bu yüzden hep UTC'de okunur.
 */
const dueDateFormat = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function formatDueDate(iso: string) {
  return dueDateFormat.format(new Date(iso));
}

// Yorum zamanı gerçek bir an: son tarihin aksine kullanıcının yerel saatiyle gösterilir.
const commentTimeFormat = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatCommentTime(iso: string) {
  return commentTimeFormat.format(new Date(iso));
}

// "2026-11-12T00:00:00.000Z" → "2026-11-12" (<input type="date"> bu biçimi bekler)
export function toDateInputValue(iso: string | null) {
  return iso ? iso.slice(0, 10) : "";
}

// Son tarih bugünden önceyse ve görev bitmediyse gecikmiş. Günler metin olarak karşılaştırılır.
export function isOverdue(dueDate: string | null, status: TaskStatus) {
  if (!dueDate || status === "done") return false;
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  return toDateInputValue(dueDate) < today;
}
