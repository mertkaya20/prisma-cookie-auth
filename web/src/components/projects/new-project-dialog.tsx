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

export type NewProjectValues = { name: string; description?: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  error: string | null;
  onSubmit: (values: NewProjectValues) => void;
};

// "New project" penceresi. API'yi bilmez: girilen değerleri onSubmit ile sayfaya verir.
export function NewProjectDialog({ open, onOpenChange, ...formProps }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-6 p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            New project
          </DialogTitle>
          <DialogDescription>
            Projects group tasks and the team working on them.
          </DialogDescription>
        </DialogHeader>
        {/* Form, kapanınca silinen içeriğin içinde: state'i her açılışta sıfırdan başlar. */}
        <NewProjectForm {...formProps} />
      </DialogContent>
    </Dialog>
  );
}

function NewProjectForm({
  pending,
  error,
  onSubmit,
}: Omit<Props, "open" | "onOpenChange">) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = description.trim();
    // API boş açıklamayı kabul etmiyor; boşsa hiç gönderme.
    onSubmit(trimmed ? { name, description: trimmed } : { name });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-2">
        <Label htmlFor="project-name">Name</Label>
        <Input
          id="project-name"
          required
          maxLength={92}
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="project-description">
          Description{" "}
          <span className="font-normal text-ink-muted">(optional)</span>
        </Label>
        <Textarea
          id="project-description"
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
          {pending ? "Creating..." : "Create project"}
        </Button>
      </DialogFooter>
    </form>
  );
}
