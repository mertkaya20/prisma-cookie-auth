import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/lib/types";

export const statusLabel: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

// Durum renkle değil şekille gösterilir: boş halka, yarım dolu, dolu ve tikli.
// Renk etiketlere bırakılır.
export function StatusRing({
  status,
  decorative = false,
  className,
}: {
  status: TaskStatus;
  // Süs olarak kullanılıyorsa (logo gibi) ekran okuyucu atlasın.
  decorative?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      {...(decorative
        ? { "aria-hidden": true }
        : { role: "img", "aria-label": statusLabel[status] })}
      className={cn("size-4 shrink-0", className)}
    >
      <circle
        cx="8"
        cy="8"
        r="6.25"
        fill={status === "done" ? "var(--pine)" : "none"}
        stroke={status === "done" ? "var(--pine)" : status === "todo" ? "var(--ink-muted)" : "var(--ink)"}
        strokeWidth="1.5"
        className="transition-[fill,stroke] duration-200"
      />
      {status === "in_progress" && <path d="M8 3.75 A4.25 4.25 0 0 1 8 12.25 Z" fill="var(--ink)" />}
      {status === "done" && (
        <path
          d="M5.25 8.25 7.1 10 10.75 6.25"
          fill="none"
          stroke="#fff"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
