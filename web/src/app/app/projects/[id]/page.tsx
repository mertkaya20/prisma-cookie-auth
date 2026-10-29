"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeftIcon,
  EllipsisIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import {
  EditProjectDialog,
  type EditProjectValues,
} from "@/components/projects/edit-project-dialog";
import { TeamSection } from "@/components/projects/team-section";
import { EmptyState } from "@/components/page-state";
import {
  NewTaskDialog,
  type NewTaskValues,
} from "@/components/tasks/new-task-dialog";
import { TaskBoard, TaskBoardSkeleton } from "@/components/tasks/task-board";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, ApiError } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";
import { useMe } from "@/lib/session";
import type {
  Member,
  Project,
  ProjectRole,
  Task,
  TaskStatus,
  User,
} from "@/lib/types";

// Üst menüdeki aktif link ile aynı görünüm: seçili sekmenin altında koyu çizgi.
const tabTriggerClass =
  "h-8 flex-none rounded-none px-0 text-ink-muted hover:text-ink data-active:text-ink group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-1px] after:rounded-full after:bg-ink";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const me = useMe();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [tab, setTab] = useState<"board" | "team">("board");

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

  const updateProject = useMutation({
    mutationFn: (body: EditProjectValues) =>
      api<{ project: Project }>(`/projects/${id}`, { method: "PATCH", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.project(id) });
      // exact: sadece liste. Olmasa ["projects"] ile başlayan her şey (bu projenin görevleri, takımı) da yenilenirdi.
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects,
        exact: true,
      });
      setEditOpen(false);
    },
  });

  const deleteProject = useMutation({
    mutationFn: () => api(`/projects/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      // exact önemli: silinmiş projenin kendi sorguları yenilenirse 404 alır ve
      // sayfa, yönlendirme bitmeden bir anlığına "Project not found" gösterir.
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects,
        exact: true,
      });
      router.replace("/app/projects");
    },
  });

  // Takıma eklenebilecek kişiler: organizasyondaki herkes.
  const usersQuery = useQuery({
    queryKey: queryKeys.users,
    queryFn: () => api<{ users: User[] }>("/users"),
  });

  const addMember = useMutation({
    mutationFn: (userId: string) =>
      api<{ member: Member }>(`/projects/${id}/members`, {
        method: "POST",
        body: { userId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projectMembers(id) });
    },
  });

  const updateMember = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: ProjectRole }) =>
      api<{ member: Member }>(`/projects/${id}/members/${userId}`, {
        method: "PATCH",
        body: { role },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projectMembers(id) });
    },
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) =>
      api(`/projects/${id}/members/${userId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projectMembers(id) });
    },
  });

  // Görev oluşturma ve durum değiştirme: owner ya da projenin ekibi (API'deki EDIT_ROLES).
  // Takımı yönetmek: owner ya da projenin manager'ı (API'deki MANAGE_ROLES).
  const isOwner = me.data?.user.role === "owner";
  const myRole = membersQuery.data?.members.find(
    (m) => m.userId === me.data?.user.id,
  )?.role;
  const canEdit = isOwner || myRole !== undefined;
  const canManage = isOwner || myRole === "manager";

  const memberError =
    addMember.error ?? updateMember.error ?? removeMember.error;

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
          <>
            {canEdit && tab === "board" && (
              <Button onClick={openDialog}>
                <PlusIcon data-icon="inline-start" />
                New task
              </Button>
            )}

            {/* Projeyi düzenlemek ve silmek sadece owner'ın (API'de requireRole("owner")). */}
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon-lg"
                      aria-label="Project actions"
                    />
                  }
                >
                  <EllipsisIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    onClick={() => {
                      updateProject.reset();
                      setEditOpen(true);
                    }}
                  >
                    <PencilIcon />
                    Edit project
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => {
                      deleteProject.reset();
                      setDeleteOpen(true);
                    }}
                  >
                    <Trash2Icon />
                    Delete project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </>
        }
      />

      {/* Seçili olmayan sekmenin içeriği DOM'dan kaldırılır (modal değil, aynı yerde içerik değişir). */}
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as "board" | "team")}
        className="gap-6"
      >
        <TabsList
          variant="line"
          className="h-auto w-full justify-start gap-6 rounded-none border-b border-line p-0"
        >
          <TabsTrigger value="board" className={tabTriggerClass}>
            Board
          </TabsTrigger>
          <TabsTrigger value="team" className={tabTriggerClass}>
            Team
            {membersQuery.data && (
              <span className="text-ink-muted tabular-nums">
                {membersQuery.data.members.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="board">
          {updateStatus.error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                Couldn&apos;t update the task.{" "}
                {getErrorMessage(updateStatus.error)}
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
        </TabsContent>

        <TabsContent value="team">
          {membersQuery.isPending ? (
            <div
              aria-hidden
              className="h-48 animate-pulse rounded-xl bg-wash"
            />
          ) : membersQuery.error ? (
            <Alert variant="destructive">
              <AlertDescription>
                {getErrorMessage(membersQuery.error)}
              </AlertDescription>
            </Alert>
          ) : (
            <TeamSection
              members={membersQuery.data.members}
              users={usersQuery.data?.users ?? []}
              meId={me.data?.user.id}
              isOwner={isOwner}
              canManage={canManage}
              onAdd={(userId) => addMember.mutate(userId)}
              onChangeRole={(userId, role) =>
                updateMember.mutate({ userId, role })
              }
              onRemove={(userId) => removeMember.mutate(userId)}
              pending={
                addMember.isPending ||
                updateMember.isPending ||
                removeMember.isPending
              }
              error={memberError ? getErrorMessage(memberError) : null}
            />
          )}
        </TabsContent>
      </Tabs>

      <NewTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectName={project.name}
        pending={createTask.isPending}
        error={createTask.error ? getErrorMessage(createTask.error) : null}
        onSubmit={(values) => createTask.mutate(values)}
      />

      <EditProjectDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
        pending={updateProject.isPending}
        error={
          updateProject.error ? getErrorMessage(updateProject.error) : null
        }
        onSubmit={(values) => updateProject.mutate(values)}
      />

      <DeleteProjectDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        projectName={project.name}
        taskCount={tasksQuery.data?.tasks.length}
        pending={deleteProject.isPending}
        error={
          deleteProject.error ? getErrorMessage(deleteProject.error) : null
        }
        onConfirm={() => deleteProject.mutate()}
      />
    </>
  );
}
