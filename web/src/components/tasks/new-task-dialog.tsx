"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type NewTaskValues = { title: string; description?: string; dueDate?: string };

// "New task" penceresi. NewProjectDialog ile aynı yapı: API'yi bilmez, değerleri onSubmit ile verir.
export function NewTaskDialog({
  open,
  onOpenChange,
  projectName,
  pending,
  error,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  pending: boolean;
  error: string | null;
  onSubmit: (values: NewTaskValues) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-6 p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">New task</DialogTitle>
          <DialogDescription>Adds a task to {projectName}. It starts in To do.</DialogDescription>
        </DialogHeader>
        {/* Form, kapanınca silinen içeriğin içinde: state'i her açılışta sıfırdan başlar. */}
        <NewTaskForm pending={pending} error={error} onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>
  );
}

function NewTaskForm({
  pending,
  error,
  onSubmit,
}: {
  pending: boolean;
  error: string | null;
  onSubmit: (values: NewTaskValues) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values: NewTaskValues = { title };
    // API boş metni kabul etmiyor; doldurulmayan alanlar hiç gönderilmez.
    if (description.trim()) values.description = description.trim();
    if (dueDate) values.dueDate = dueDate;
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-2">
        <Label htmlFor="task-title">Title</Label>
        <Input
          id="task-title"
          required
          maxLength={200}
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="task-description">
          Description <span className="font-normal text-ink-muted">(optional)</span>
        </Label>
        <Textarea
          id="task-description"
          maxLength={2000}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="task-due">
          Due date <span className="font-normal text-ink-muted">(optional)</span>
        </Label>
        <Input
          id="task-due"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-auto"
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <DialogFooter className="-mx-6 -mb-6 px-6 py-4">
        <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "Adding..." : "Add task"}
        </Button>
      </DialogFooter>
    </form>
  );
}
