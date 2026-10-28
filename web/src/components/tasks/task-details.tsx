import { CalendarIcon } from "lucide-react";
import { StatusMenu } from "@/components/tasks/status-menu";
import { statusLabel } from "@/components/status-ring";
import { formatDueDate, isOverdue } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/lib/types";

// Görev sayfasının sağ paneli: durum, son tarih, oluşturan. (Atananlar ve etiketler 7.6c2'de.)
export function TaskDetails({
  task,
  canEdit,
  onChangeStatus,
}: {
  task: Task;
  canEdit: boolean;
  onChangeStatus: (status: TaskStatus) => void;
}) {
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <dl className="divide-y divide-line rounded-xl border border-line bg-surface text-sm">
      <DetailRow label="Status">
        <span className="flex items-center gap-2">
          <StatusMenu status={task.status} canEdit={canEdit} onChange={onChangeStatus} />
          {statusLabel[task.status]}
        </span>
      </DetailRow>

      <DetailRow label="Due date">
        {task.dueDate ? (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 tabular-nums",
              overdue && "font-medium text-danger",
            )}
          >
            <CalendarIcon className="size-4" aria-hidden />
            {formatDueDate(task.dueDate)}
            {overdue && <span>(overdue)</span>}
          </span>
        ) : (
          <span className="text-ink-muted">No due date</span>
        )}
      </DetailRow>

      <DetailRow label="Created by">{task.createdBy.name}</DetailRow>
    </dl>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-12 items-center gap-4 px-4 py-2.5">
      <dt className="w-24 shrink-0 text-ink-muted">{label}</dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  );
}
