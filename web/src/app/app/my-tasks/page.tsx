"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/page-state";
import {
  MyTaskList,
  MyTaskListSkeleton,
} from "@/components/tasks/my-task-list";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";
import type { AssignedTask, Task, TaskStatus } from "@/lib/types";

export default function MyTasksPage() {
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: queryKeys.assignedTasks,
    queryFn: () => api<{ tasks: AssignedTask[] }>("/tasks/assigned-to-me"),
  });

  const updateStatus = useMutation({
    mutationFn: ({
      task,
      status,
    }: {
      task: AssignedTask;
      status: TaskStatus;
    }) =>
      api<{ task: Task }>(`/tasks/${task.id}`, {
        method: "PATCH",
        body: { status },
      }),
    onSuccess: (_data, { task }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assignedTasks });
      // Aynı görev board'da ve kendi sayfasında da görünüyor; oralar da eskidi.
      queryClient.invalidateQueries({ queryKey: queryKeys.task(task.id) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectTasks(task.projectId),
      });
    },
  });

  return (
    <>
      <PageHeader
        title="My tasks"
        description="Tasks assigned to you, across all projects."
      />

      {updateStatus.error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            Couldn&apos;t update the task. {getErrorMessage(updateStatus.error)}
          </AlertDescription>
        </Alert>
      )}

      {tasksQuery.isPending ? (
        <MyTaskListSkeleton />
      ) : tasksQuery.error ? (
        <Alert variant="destructive">
          <AlertDescription>
            {getErrorMessage(tasksQuery.error)}
          </AlertDescription>
        </Alert>
      ) : tasksQuery.data.tasks.length === 0 ? (
        <EmptyState
          title="Nothing assigned to you"
          description="When someone assigns you a task, it shows up here."
          action={
            <Link
              href="/app/projects"
              className={buttonVariants({ variant: "outline" })}
            >
              Go to projects
            </Link>
          }
        />
      ) : (
        <MyTaskList
          tasks={tasksQuery.data.tasks}
          onChangeStatus={(task, status) =>
            updateStatus.mutate({ task, status })
          }
        />
      )}
    </>
  );
}
