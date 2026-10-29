"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Project } from "@/lib/types";

// API'deki updateProjectSchema: açıklama null gönderilerek silinebilir.
export type EditProjectValues = {
  name: string;
  description: string | null;
};

export function EditProjectDialog({
  open,
  onOpenChange,
  project,
  pending,
  error,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  pending: boolean;
  error: string | null;
  onSubmit: (values: EditProjectValues) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-6 p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Edit project
          </DialogTitle>
        </DialogHeader>
        <EditProjectForm
          project={project}
          pending={pending}
          error={error}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}

function EditProjectForm({
  project,
  pending,
  error,
  onSubmit,
}: {
  project: Project;
  pending: boolean;
  error: string | null;
  onSubmit: (values: EditProjectValues) => void;
}) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Boş bırakılan açıklama null olarak gider: API onu siler.
    onSubmit({ name, description: description.trim() || null });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-2">
        <Label htmlFor="edit-project-name">Name</Label>
        <Input
          id="edit-project-name"
          required
          maxLength={92}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="edit-project-description">
          Description{" "}
          <span className="font-normal text-ink-muted">(optional)</span>
        </Label>
        <Textarea
          id="edit-project-description"
          maxLength={320}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <DialogFooter className="-mx-6 -mb-6 px-6 py-4">
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancel
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}
