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
import { toDateInputValue } from "@/lib/format";
import type { Task } from "@/lib/types";

// API'deki updateTaskSchema: açıklama ve son tarih null gönderilerek silinebilir.
export type EditTaskValues = {
  title: string;
  description: string | null;
  dueDate: string | null;
};

export function EditTaskDialog({
  open,
  onOpenChange,
  task,
  pending,
  error,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
  pending: boolean;
  error: string | null;
  onSubmit: (values: EditTaskValues) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-6 p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Edit task</DialogTitle>
        </DialogHeader>
        {/* Form, kapanınca silinen içeriğin içinde: her açılışta görevin güncel haliyle başlar. */}
        <EditTaskForm task={task} pending={pending} error={error} onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>
  );
}

function EditTaskForm({
  task,
  pending,
  error,
  onSubmit,
}: {
  task: Task;
  pending: boolean;
  error: string | null;
  onSubmit: (values: EditTaskValues) => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [dueDate, setDueDate] = useState(toDateInputValue(task.dueDate));

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Boş bırakılan alan null olarak gider: API o alanı siler.
    onSubmit({
      title,
      description: description.trim() || null,
      dueDate: dueDate || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-2">
        <Label htmlFor="edit-title">Title</Label>
        <Input
          id="edit-title"
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="edit-description">Description</Label>
        <Textarea
          id="edit-description"
          maxLength={2000}
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="edit-due">Due date</Label>
        <div className="flex items-center gap-2">
          <Input
            id="edit-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-auto"
          />
          {dueDate && (
            <Button type="button" variant="ghost" onClick={() => setDueDate("")}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <DialogFooter className="-mx-6 -mb-6 px-6 py-4">
        <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}
