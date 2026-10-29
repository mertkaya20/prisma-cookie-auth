import Link from "next/link";
import { CalendarIcon } from "lucide-react";
import { StatusRing, statusLabel } from "@/components/status-ring";
import { TagChip } from "@/components/tag-chip";
import { StatusMenu } from "@/components/tasks/status-menu";
import { formatDueDate, isOverdue, statusOrder } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AssignedTask, TaskStatus } from "@/lib/types";

// Bana atanan görevler durumlarına göre gruplu, alt alta. Boş gruplar gösterilmez.
export function MyTaskList({
  tasks,
  onChangeStatus,
}: {
  tasks: AssignedTask[];
  onChangeStatus: (task: AssignedTask, status: TaskStatus) => void;
}) {
  return (
    <div className="flex flex-col gap-8">
      {statusOrder.map((status) => {
        const group = tasks.filter((task) => task.status === status);
        if (group.length === 0) return null;

        return (
          <section key={status} aria-labelledby={`group-${status}`}>
            <h2
              id={`group-${status}`}
              className="mb-3 flex items-center gap-2 text-sm font-medium"
            >
              <StatusRing status={status} decorative />
              {statusLabel[status]}
              <span className="text-ink-muted tabular-nums">
                {group.length}
              </span>
            </h2>

            <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
              {group.map((task) => (
                <MyTaskRow
                  key={task.id}
                  task={task}
                  onChangeStatus={onChangeStatus}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function MyTaskRow({
  task,
  onChangeStatus,
}: {
  task: AssignedTask;
  onChangeStatus: (task: AssignedTask, status: TaskStatus) => void;
}) {
  const done = task.status === "done";
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      {/* Halka başlığın ilk satırıyla aynı hizada (TaskCard ile aynı). */}
      <div className="flex h-[1.375rem] items-center">
        {/* Bana atanmışsa projenin ekibindeyim: durumu değiştirebilirim. API yine de kontrol eder. */}
        <StatusMenu
          status={task.status}
          canEdit
          onChange={(status) => onChangeStatus(task, status)}
        />
      </div>

      <div className="min-w-0 flex-1">
        <Link
          href={`/app/tasks/${task.id}`}
          className={cn(
            "block leading-snug font-medium break-words outline-none hover:underline focus-visible:underline",
            done && "text-ink-muted line-through decoration-line",
          )}
        >
          {task.title}
        </Link>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink-muted">
          <Link
            href={`/app/projects/${task.project.id}`}
            className="outline-none hover:text-ink hover:underline focus-visible:underline"
          >
            {task.project.name}
          </Link>

          {task.dueDate && (
            <span
              className={cn(
                "inline-flex items-center gap-1 tabular-nums",
                overdue && "font-medium text-danger",
              )}
            >
              <CalendarIcon className="size-3.5" aria-hidden />
              {formatDueDate(task.dueDate)}
              {overdue && <span>(overdue)</span>}
            </span>
          )}

          {task.tags.map(({ tag }) => (
            <TagChip key={tag.id} name={tag.name} color={tag.color} />
          ))}
        </div>
      </div>
    </li>
  );
}

export function MyTaskListSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-3">
      <div className="h-4 w-24 animate-pulse rounded bg-wash" />
      <div className="h-40 animate-pulse rounded-xl bg-wash" />
    </div>
  );
}
