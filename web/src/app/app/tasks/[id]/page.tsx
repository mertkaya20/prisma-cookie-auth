"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeftIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { EmptyState } from "@/components/page-state";
import { DeleteTaskDialog } from "@/components/tasks/delete-task-dialog";
import {
  EditTaskDialog,
  type EditTaskValues,
} from "@/components/tasks/edit-task-dialog";
import { DetailRow, TaskDetails } from "@/components/tasks/task-details";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";
import { useMe } from "@/lib/session";
import type {
  Member,
  Project,
  TagSummary,
  Task,
  TaskStatus,
  User,
} from "@/lib/types";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TagChip } from "@/components/tag-chip";

export default function TaskPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const me = useMe();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const taskQuery = useQuery({
    queryKey: queryKeys.task(id),
    queryFn: () => api<{ task: Task }>(`/tasks/${id}`),
  });

  const projectId = taskQuery.data?.task.projectId;

  const projectQuery = useQuery({
    queryKey: queryKeys.project(projectId ?? ""),
    queryFn: () => api<{ project: Project }>(`/projects/${projectId}`),
    enabled: projectId !== undefined,
  });

  const membersQuery = useQuery({
    queryKey: queryKeys.projectMembers(projectId ?? ""),
    queryFn: () => api<{ members: Member[] }>(`/projects/${projectId}/members`),
    enabled: projectId !== undefined,
  });

  const updateTask = useMutation({
    mutationFn: (body: Partial<EditTaskValues & { status: TaskStatus }>) =>
      api<{ task: Task }>(`/tasks/${id}`, { method: "PATCH", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.task(id) });
      if (projectId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projectTasks(projectId),
        });
      }
      setEditOpen(false);
    },
  });

  const deleteTask = useMutation({
    mutationFn: () => api(`/tasks/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projectTasks(projectId),
        });
      }
      router.replace(`/app/projects/${projectId}`);
    },
  });

  const assign = useMutation({
    mutationFn: (userId: string) =>
      api<{ task: Task }>(`/tasks/${id}/assignees`, {
        method: "POST",
        body: { userId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.task(id),
      });
      if (projectId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projectTasks(projectId),
        });
      }
    },
  });

  const unassign = useMutation({
    mutationFn: (userId: string) =>
      api(`/tasks/${id}/assignees/${userId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.task(id),
      });
      if (projectId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projectTasks(projectId),
        });
      }
    },
  });

  const tagsQuery = useQuery({
    queryKey: queryKeys.tags,
    queryFn: () => api<{ tags: TagSummary[] }>("/tags"),
  });

  const addTag = useMutation({
    mutationFn: (tagId: string) =>
      api<{ task: Task }>(`/tasks/${id}/tags`, {
        method: "POST",
        body: { tagId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.task(id) });
      if (projectId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projectTasks(projectId),
        });
      }
    },
  });

  const removeTag = useMutation({
    mutationFn: (tagId: string) =>
      api(`/tasks/${id}/tags/${tagId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.task(id) });
      if (projectId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projectTasks(projectId),
        });
      }
    },
  });

  // Düzenleme: owner ya da ekip. Silme: owner ya da projenin manager'ı (API'deki EDIT_ROLES / MANAGE_ROLES).
  const isOwner = me.data?.user.role === "owner";
  const myRole = membersQuery.data?.members.find(
    (m) => m.userId === me.data?.user.id,
  )?.role;
  const canEdit = isOwner || myRole !== undefined;
  const canDelete = isOwner || myRole === "manager";
  const canAssign = isOwner || myRole === "manager";

  if (taskQuery.isPending) {
    return (
      <div aria-hidden className="space-y-4">
        <div className="h-4 w-24 animate-pulse rounded bg-wash" />
        <div className="h-8 w-80 max-w-full animate-pulse rounded bg-wash" />
        <div className="h-24 animate-pulse rounded-xl bg-wash" />
      </div>
    );
  }

  if (taskQuery.error) {
    const notFound =
      taskQuery.error instanceof ApiError && taskQuery.error.status === 404;
    return (
      <EmptyState
        title={notFound ? "Task not found" : "Couldn't load this task"}
        description={
          notFound
            ? "It may have been deleted, or the link is wrong."
            : getErrorMessage(taskQuery.error)
        }
        action={
          <Link
            href="/app/projects"
            className={buttonVariants({ variant: "outline" })}
          >
            Back to projects
          </Link>
        }
      />
    );
  }

  const task = taskQuery.data.task;

  return (
    <>
      <Link
        href={`/app/projects/${task.projectId}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
      >
        <ChevronLeftIcon className="size-4" />
        {projectQuery.data?.project.name ?? "Project"}
      </Link>

      {/* Düzenleme dialog'u kapalıyken olan güncelleme hatası (örneğin durum değiştirirken). */}
      {updateTask.error && !editOpen && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            Couldn&apos;t update the task. {getErrorMessage(updateTask.error)}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-[1.5625rem] leading-tight font-semibold tracking-tight break-words">
              {task.title}
            </h1>
            {canEdit && (
              <Button
                variant="outline"
                onClick={() => {
                  updateTask.reset();
                  setEditOpen(true);
                }}
              >
                <PencilIcon data-icon="inline-start" />
                Edit
              </Button>
            )}
          </div>

          <div className="mt-6 max-w-[70ch]">
            {task.description ? (
              <p className="leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            ) : (
              <p className="text-ink-muted">No description.</p>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-3">
          <TaskDetails
            task={task}
            canEdit={canEdit}
            onChangeStatus={(status) => updateTask.mutate({ status })}
          />
          <AssigneesSection
            assignees={task.assignees}
            members={membersQuery.data?.members ?? []}
            canAssign={canAssign}
            onAssign={(userId) => assign.mutate(userId)}
            onUnassign={(userId) => unassign.mutate(userId)}
            pending={assign.isPending || unassign.isPending}
            error={
              assign.error || unassign.error
                ? getErrorMessage(assign.error ?? unassign.error)
                : null
            }
          />
          <TagsSection
            tags={task.tags}
            orgTags={tagsQuery.data?.tags ?? []}
            canEdit={canEdit}
            onAddTag={(tagId) => addTag.mutate(tagId)}
            onRemoveTag={(tagId) => removeTag.mutate(tagId)}
            pending={addTag.isPending || removeTag.isPending}
            error={
              addTag.error || removeTag.error
                ? getErrorMessage(addTag.error ?? removeTag.error)
                : null
            }
          />
          {canDelete && (
            <Button
              variant="ghost"
              className="self-start text-danger hover:bg-danger/10 hover:text-danger  "
              onClick={() => {
                deleteTask.reset();
                setDeleteOpen(true);
              }}
            >
              <Trash2Icon data-icon="inline-start" />
              Delete task
            </Button>
          )}
        </aside>
      </div>

      <EditTaskDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        task={task}
        pending={updateTask.isPending}
        error={updateTask.error ? getErrorMessage(updateTask.error) : null}
        onSubmit={(values) => updateTask.mutate(values)}
      />

      <DeleteTaskDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        taskTitle={task.title}
        pending={deleteTask.isPending}
        error={deleteTask.error ? getErrorMessage(deleteTask.error) : null}
        onConfirm={() => deleteTask.mutate()}
      />
    </>
  );
}

function AssigneesSection({
  assignees,
  canAssign,
  members,
  onAssign,
  onUnassign,
  pending,
  error,
}: {
  assignees: { user: User }[];
  canAssign: boolean;
  members: Member[];
  onAssign: (userId: string) => void;
  onUnassign: (userId: string) => void;
  pending: boolean;
  error: string | null;
}) {
  const [open, setOpen] = useState(false);
  return (
    <dl className="rounded-xl border border-line bg-surface text-sm">
      <DetailRow label="Assignees" alignTop>
        <div className="flex flex-col gap-2 py-0.5">
          {assignees.length === 0 ? (
            <p className="text-ink-muted">No one assigned</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {assignees.map((a) => (
                <li
                  key={a.user.id}
                  className="flex items-start justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{a.user.name}</p>
                    <p className="truncate text-xs text-ink-muted">
                      {a.user.email}
                    </p>
                  </div>
                  {canAssign && (
                    <button
                      type="button"
                      onClick={() => onUnassign(a.user.id)}
                      disabled={pending}
                      aria-label={`Remove ${a.user.name}`}
                      className="-mr-1 shrink-0 rounded p-1 text-ink-muted outline-none hover:bg-wash hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                    >
                      <XIcon className="size-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {canAssign && (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2.5 self-start"
              onClick={() => setOpen(true)}
            >
              <PlusIcon data-icon="inline-start" />
              Assign
            </Button>
          )}

          {/* Modal'ın dışında da görünsün: ✕ ile kaldırma başarısız olursa. */}
          {error && !open && <p className="text-xs text-danger">{error}</p>}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="gap-5 p-6 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                Assign people
              </DialogTitle>
              <DialogDescription>
                Only people on the project team can be assigned.
              </DialogDescription>
            </DialogHeader>

            {members.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-ink-muted">
                No one is on this project&apos;s team yet.
              </p>
            ) : (
              <ul className="-mx-2 flex max-h-80 flex-col overflow-y-auto">
                {members.map((m) => {
                  const isAssigned = assignees.some(
                    (a) => a.user.id === m.userId,
                  );
                  return (
                    <li
                      key={m.userId}
                      className="flex items-center justify-between gap-3 rounded-lg px-2 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{m.user.name}</p>
                        <p className="truncate text-xs text-ink-muted">
                          {m.user.email}
                        </p>
                      </div>
                      {isAssigned ? (
                        <span className="shrink-0 text-xs text-ink-muted">
                          Already assigned
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0"
                          disabled={pending}
                          onClick={() => onAssign(m.userId)}
                        >
                          Assign
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter className="-mx-6 -mb-6 px-6 py-4">
              <DialogClose render={<Button type="button" />}>Done</DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DetailRow>
    </dl>
  );
}

function TagsSection({
  tags,
  orgTags,
  canEdit,
  onAddTag,
  onRemoveTag,
  pending,
  error,
}: {
  tags: { tag: TagSummary }[];
  orgTags: TagSummary[];
  canEdit: boolean;
  onAddTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
  pending: boolean;
  error: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <dl className="rounded-xl border border-line bg-surface text-sm">
      <DetailRow label="Tags" alignTop>
        <div className="flex flex-col gap-2 py-0.5">
          {tags.length === 0 ? (
            <p className="text-ink-muted">No tags</p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <li key={t.tag.id} className="flex items-center gap-0.5">
                  <TagChip name={t.tag.name} color={t.tag.color} />
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => onRemoveTag(t.tag.id)}
                      disabled={pending}
                      aria-label={`Remove ${t.tag.name}`}
                      className="shrink-0 rounded p-0.5 text-ink-muted outline-none hover:bg-wash hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2.5 self-start"
              onClick={() => setOpen(true)}
            >
              <PlusIcon data-icon="inline-start" />
              Add tag
            </Button>
          )}

          {error && !open && <p className="text-xs text-danger">{error}</p>}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="gap-5 p-6 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                Add tag
              </DialogTitle>
              <DialogDescription>
                Tags are shared across your organization.
              </DialogDescription>
            </DialogHeader>
            {orgTags.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-ink-muted">
                Your organization has no tags yet.
              </p>
            ) : (
              <ul className="-mx-2 flex max-h-80 flex-col overflow-y-auto">
                {orgTags.map((ot) => {
                  const isAdded = tags.some((t) => t.tag.id === ot.id);

                  return (
                    <li
                      key={ot.id}
                      className="flex items-center justify-between gap-3 rounded-lg px-2 py-2"
                    >
                      <TagChip name={ot.name} color={ot.color} />
                      {isAdded ? (
                        <span className="shrink-0 text-xs text-ink-muted">
                          Added
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0"
                          disabled={pending}
                          onClick={() => onAddTag(ot.id)}
                        >
                          Add
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <DialogFooter className="-mx-6 -mb-6 px-6 py-4">
              <DialogClose render={<Button type="button" />}>Done</DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DetailRow>
    </dl>
  );
}
