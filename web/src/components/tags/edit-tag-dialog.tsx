"use client";

import { useState } from "react";
import { TagChip } from "@/components/tag-chip";
import { ColorPicker } from "@/components/tags/color-picker";
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
import type { TagSummary } from "@/lib/types";

// API'deki updateTagSchema: renk null gönderilerek kaldırılabilir.
export type EditTagValues = { name: string; color: string | null };

// tag null ise dialog kapalı; hangi etiketin düzenlendiğini de bu tutar.
export function EditTagDialog({
  tag,
  onClose,
  pending,
  error,
  onSubmit,
}: {
  tag: TagSummary | null;
  onClose: () => void;
  pending: boolean;
  error: string | null;
  onSubmit: (values: EditTagValues) => void;
}) {
  return (
    <Dialog
      open={tag !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="gap-6 p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Edit tag</DialogTitle>
          <DialogDescription>
            Changes show up on every task that has this tag.
          </DialogDescription>
        </DialogHeader>
        {tag && (
          <EditTagForm
            tag={tag}
            pending={pending}
            error={error}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// Düzenle'ye basınca açılır, etiketin o anki haliyle başlar (EditTaskForm ile aynı fikir).
function EditTagForm({
  tag,
  pending,
  error,
  onSubmit,
}: {
  tag: TagSummary;
  pending: boolean;
  error: string | null;
  onSubmit: (values: EditTagValues) => void;
}) {
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState(tag.color);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({ name, color });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-2">
        <Label htmlFor="edit-tag-name">Name</Label>
        <Input
          id="edit-tag-name"
          required
          maxLength={40}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label>Color</Label>
        <ColorPicker value={color} onChange={setColor} />
      </div>

      <div className="flex items-center gap-2 text-sm text-ink-muted">
        Preview
        <TagChip name={name.trim() || "tag"} color={color} />
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
