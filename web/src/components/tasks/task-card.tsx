import Link from "next/link";
import { CalendarIcon } from "lucide-react";
import { TagChip } from "@/components/tag-chip";
import { StatusMenu } from "@/components/tasks/status-menu";
import { formatDueDate, initials, isOverdue } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/lib/types";

const MAX_AVATARS = 3;

export function TaskCard({
  task,
  canEdit,
  onChangeStatus,
}: {
  task: Task;
  canEdit: boolean;
  onChangeStatus: (task: Task, status: TaskStatus) => void;
}) {
  const done = task.status === "done";
  const overdue = isOverdue(task.dueDate, task.status);
  const people = task.assignees.map((assignee) => assignee.user);
  const hidden = people.length - MAX_AVATARS;

  return (
    <article className="rounded-lg border border-line bg-surface p-3">
      <div className="flex items-start gap-2.5">
        {/* Halka başlığın ilk satırıyla aynı hizada. */}
        <div className="flex h-[1.375rem] items-center">
          <StatusMenu
            status={task.status}
            canEdit={canEdit}
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

          {task.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {task.tags.map(({ tag }) => (
                <TagChip key={tag.id} name={tag.name} color={tag.color} />
              ))}
            </div>
          )}

          {(task.dueDate || people.length > 0) && (
            <div className="mt-2.5 flex items-center justify-between gap-2">
              {task.dueDate ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-xs tabular-nums",
                    overdue ? "font-medium text-danger" : "text-ink-muted",
                  )}
                >
                  <CalendarIcon className="size-3.5" aria-hidden />
                  {formatDueDate(task.dueDate)}
                  {overdue && <span>(overdue)</span>}
                </span>
              ) : (
                <span />
              )}

              {people.length > 0 && (
                <ul className="flex gap-1" aria-label="Assignees">
                  {people.slice(0, MAX_AVATARS).map((person) => (
                    <li
                      key={person.id}
                      title={
                        person.deactivatedAt
                          ? `${person.name} (deactivated)`
                          : person.name
                      }
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full text-[0.625rem] font-semibold",
                        // Devre dışı kişi soluk: hâlâ atanmış ama artık çalışmıyor.
                        person.deactivatedAt
                          ? "border border-dashed border-ink-muted text-ink-muted"
                          : "bg-ink text-white",
                      )}
                    >
                      <span aria-hidden>{initials(person.name)}</span>
                      <span className="sr-only">
                        {person.name}
                        {person.deactivatedAt && " (deactivated)"}
                      </span>
                    </li>
                  ))}
                  {hidden > 0 && (
                    <li className="flex size-6 items-center justify-center rounded-full bg-wash text-[0.625rem] font-semibold text-ink-muted">
                      +{hidden}
                    </li>
                  )}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
