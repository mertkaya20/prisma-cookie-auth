"use client";

import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { StatusRing, statusLabel } from "@/components/status-ring";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { statusOrder } from "@/lib/format";
import type { TaskStatus } from "@/lib/types";

// Görevi düzenleyebilen için: halkaya tıklayınca durumları listeleyen bir menü açılır.
// Düzenleyemeyen için: sadece durumu gösteren halka.
export function StatusMenu({
  status,
  canEdit,
  onChange,
}: {
  status: TaskStatus;
  canEdit: boolean;
  onChange: (status: TaskStatus) => void;
}) {
  if (!canEdit) {
    return <StatusRing status={status} className="size-5 shrink-0" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Status: ${statusLabel[status]}. Change status`}
        title="Change status"
        className="-m-1 flex shrink-0 items-center gap-0.5 rounded-full p-1 pr-0.5 text-ink-muted outline-none hover:bg-wash focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:bg-wash"
      >
        <StatusRing status={status} decorative className="size-5" />
        <ChevronDownIcon className="size-3" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {statusOrder.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => {
              if (option !== status) onChange(option);
            }}
            className="justify-between py-1.5"
          >
            <span className="flex items-center gap-2">
              <StatusRing status={option} decorative />
              {statusLabel[option]}
            </span>
            {option === status && <CheckIcon className="text-ink-muted" aria-label="Current" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
