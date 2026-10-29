import { StatusRing, statusLabel } from "@/components/status-ring";
import { TaskCard } from "@/components/tasks/task-card";
import { statusOrder } from "@/lib/format";
import type { Task, TaskStatus } from "@/lib/types";

// Görevler duruma göre üç sütunda. Mobilde sütunlar alt alta.
export function TaskBoard({
  tasks,
  canEdit,
  onChangeStatus,
}: {
  tasks: Task[];
  canEdit: boolean;
  onChangeStatus: (task: Task, status: TaskStatus) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {statusOrder.map((status) => {
        const column = tasks.filter((task) => task.status === status);
        return (
          <section
            key={status}
            aria-labelledby={`column-${status}`}
            className="rounded-xl bg-wash/60 p-2"
          >
            <h2
              id={`column-${status}`}
              className="flex items-center gap-2 px-2 pt-1 pb-3 text-sm font-medium"
            >
              <StatusRing status={status} decorative />
              {statusLabel[status]}
              <span className="text-ink-muted tabular-nums">{column.length}</span>
            </h2>

            {column.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-sm text-ink-muted">
                No tasks
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {column.map((task) => (
                  <li key={task.id}>
                    <TaskCard task={task} canEdit={canEdit} onChangeStatus={onChangeStatus} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

export function TaskBoardSkeleton() {
  return (
    <div aria-hidden className="grid gap-4 md:grid-cols-3">
      {statusOrder.map((status) => (
        <div key={status} className="rounded-xl bg-wash/60 p-2">
          <div className="mx-2 mt-1 mb-3 h-4 w-24 animate-pulse rounded bg-line" />
          <div className="flex flex-col gap-2">
            <div className="h-16 animate-pulse rounded-lg bg-surface" />
            <div className="h-16 animate-pulse rounded-lg bg-surface" />
          </div>
        </div>
      ))}
    </div>
  );
}
