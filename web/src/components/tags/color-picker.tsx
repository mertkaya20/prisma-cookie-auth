import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Serbest renk seçici yerine sabit bir palet: etiketler birbiriyle uyumlu kalır.
// API rengi büyük harfe çevirerek sakladığı için değerler de büyük harf.
const palette = [
  { value: "#DC2626", name: "Red" },
  { value: "#EA580C", name: "Orange" },
  { value: "#CA8A04", name: "Yellow" },
  { value: "#16A34A", name: "Green" },
  { value: "#0D9488", name: "Teal" },
  { value: "#2563EB", name: "Blue" },
  { value: "#7C3AED", name: "Violet" },
  { value: "#DB2777", name: "Pink" },
];

// value null ise renk yok. Paletin dışındaki eski bir renk de seçenek olarak gösterilir, kaybolmasın.
export function ColorPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (color: string | null) => void;
}) {
  const options = [{ value: null, name: "No color" }, ...palette];
  if (value && !palette.some((p) => p.value === value)) {
    options.push({ value, name: `Current color ${value}` });
  }

  return (
    <div role="radiogroup" aria-label="Color" className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value ?? "none"}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.name}
            title={option.name}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex size-7 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              option.value === null && "border border-dashed border-ink-muted",
              selected && "ring-2 ring-ink ring-offset-2 ring-offset-surface",
            )}
            style={option.value ? { backgroundColor: option.value } : undefined}
          >
            {selected && (
              <CheckIcon
                aria-hidden
                className={cn(
                  "size-4",
                  option.value ? "text-white" : "text-ink-muted",
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
