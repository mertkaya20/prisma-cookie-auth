import { cn } from "@/lib/utils";

// Rengi kullanıcı seçer; okunabilirlik için metin her zaman mürekkep rengi kalır,
// renk sadece noktada görünür.
export function TagChip({
  name,
  color,
  className,
}: {
  name: string;
  color: string | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2 py-0.5 text-xs font-medium text-ink",
        className,
      )}
    >
      <span
        aria-hidden
        className="size-2 rounded-full"
        style={{ backgroundColor: color ?? "var(--ink-muted)" }}
      />
      {name}
    </span>
  );
}
