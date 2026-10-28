"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/page-state";
import {
  NewProjectDialog,
  type NewProjectValues,
} from "@/components/projects/new-project-dialog";
import {
  ProjectList,
  ProjectListSkeleton,
} from "@/components/projects/project-list";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { useMe } from "@/lib/session";
import type { Project } from "@/lib/types";

export default function ProjectsPage() {
  const me = useMe();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const isOwner = me.data?.user.role === "owner";

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => api<{ projects: Project[] }>("/projects"),
  });

  const createProject = useMutation({
    mutationFn: (body: NewProjectValues) =>
      api<{ project: Project }>("/projects", { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setDialogOpen(false);
    },
  });

  function openDialog() {
    createProject.reset();
    setDialogOpen(true);
  }

  const newProjectButton = isOwner && (
    <Button onClick={openDialog}>
      <PlusIcon data-icon="inline-start" />
      New project
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Projects"
        description="Every project in your organization."
        actions={newProjectButton}
      />

      {projectsQuery.isPending ? (
        <ProjectListSkeleton />
      ) : projectsQuery.error ? (
        <Alert variant="destructive">
          <AlertDescription>
            {getErrorMessage(projectsQuery.error)}
          </AlertDescription>
        </Alert>
      ) : projectsQuery.data.projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description={
            isOwner
              ? "Create the first project, then add your team to it."
              : "Your organization's owner hasn't created any projects yet."
          }
          action={newProjectButton}
        />
      ) : (
        <ProjectList projects={projectsQuery.data.projects} />
      )}

      <NewProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        pending={createProject.isPending}
        error={
          createProject.error ? getErrorMessage(createProject.error) : null
        }
        onSubmit={(values) => createProject.mutate(values)}
      />
    </>
  );
}
