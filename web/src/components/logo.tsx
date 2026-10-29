import { StatusRing } from "@/components/status-ring";
import { cn } from "@/lib/utils";

// Logo: "yapılıyor" halkası + isim. Ürünün adı da işaretiyle aynı şeyi anlatıyor.
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-lg font-semibold tracking-tight", className)}>
      <StatusRing status="in_progress" decorative className="size-5" />
      Halfway
    </span>
  );
}
