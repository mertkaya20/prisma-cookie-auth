"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeftIcon, PlusIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/page-state";
import {
  NewTaskDialog,
  type NewTaskValues,
} from "@/components/tasks/new-task-dialog";
import { TaskBoard, TaskBoardSkeleton } from "@/components/tasks/task-board";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";
import { useMe } from "@/lib/session";
import type { Member, Project, Task, TaskStatus } from "@/lib/types";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const me = useMe();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const projectQuery = useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => api<{ project: Project }>(`/projects/${id}`),
  });

  const tasksQuery = useQuery({
    queryKey: queryKeys.projectTasks(id),
    queryFn: () => api<{ tasks: Task[] }>(`/projects/${id}/tasks`),
  });

  const membersQuery = useQuery({
    queryKey: queryKeys.projectMembers(id),
    queryFn: () => api<{ members: Member[] }>(`/projects/${id}/members`),
  });

  const createTask = useMutation({
    mutationFn: (body: NewTaskValues) =>
      api<{ task: Task }>(`/projects/${id}/tasks`, { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectTasks(id),
      });
      setDialogOpen(false);
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      api<{ task: Task }>(`/tasks/${taskId}`, {
        method: "PATCH",
        body: { status },
      }),
    onMutate: async ({ taskId, status }) => {
      const key = queryKeys.projectTasks(id);

      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<{ tasks: Task[] }>(key);

      queryClient.setQueryData<{ tasks: Task[] }>(
        key,
        (old) =>
          old && {
            tasks: old.tasks.map((t) =>
              t.id === taskId ? { ...t, status } : t,
            ),
          },
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.projectTasks(id), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projectTasks(id) });
    },
  });

  // Görev oluşturma ve durum değiştirme: owner ya da projenin ekibi (API'deki EDIT_ROLES).
  const isOwner = me.data?.user.role === "owner";
  const isOnTeam =
    membersQuery.data?.members.some((m) => m.userId === me.data?.user.id) ??
    false;
  const canEdit = isOwner || isOnTeam;

  if (projectQuery.isPending) {
    return (
      <>
        <div className="mb-8 h-8 w-48 animate-pulse rounded bg-wash" />
        <TaskBoardSkeleton />
      </>
    );
  }

  if (projectQuery.error) {
    const notFound =
      projectQuery.error instanceof ApiError &&
      projectQuery.error.status === 404;
    return (
      <EmptyState
        title={notFound ? "Project not found" : "Couldn't load this project"}
        description={
          notFound
            ? "It may have been deleted, or the link is wrong."
            : getErrorMessage(projectQuery.error)
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

  const project = projectQuery.data.project;

  function openDialog() {
    createTask.reset();
    setDialogOpen(true);
  }

  return (
    <>
      <Link
        href="/app/projects"
        className="mb-4 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
      >
        <ChevronLeftIcon className="size-4" />
        Projects
      </Link>

      <PageHeader
        title={project.name}
        description={project.description ?? undefined}
        actions={
          canEdit && (
            <Button onClick={openDialog}>
              <PlusIcon data-icon="inline-start" />
              New task
            </Button>
          )
        }
      />

      {updateStatus.error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            Couldn&apos;t update the task. {getErrorMessage(updateStatus.error)}
          </AlertDescription>
        </Alert>
      )}

      {tasksQuery.isPending ? (
        <TaskBoardSkeleton />
      ) : tasksQuery.error ? (
        <Alert variant="destructive">
          <AlertDescription>
            {getErrorMessage(tasksQuery.error)}
          </AlertDescription>
        </Alert>
      ) : (
        <TaskBoard
          tasks={tasksQuery.data.tasks}
          canEdit={canEdit}
          onChangeStatus={(task, status) =>
            updateStatus.mutate({ taskId: task.id, status })
          }
        />
      )}

      <NewTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectName={project.name}
        pending={createTask.isPending}
        error={createTask.error ? getErrorMessage(createTask.error) : null}
        onSubmit={(values) => createTask.mutate(values)}
      />
    </>
  );
}
