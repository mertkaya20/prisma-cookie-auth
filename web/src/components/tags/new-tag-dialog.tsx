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

// API'deki createTagSchema: renk isteğe bağlı, yoksa hiç gönderilmez.
export type NewTagValues = { name: string; color?: string };

export function NewTagDialog({
  open,
  onOpenChange,
  pending,
  error,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  error: string | null;
  onSubmit: (values: NewTagValues) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-6 p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">New tag</DialogTitle>
          <DialogDescription>
            Tags are shared across your organization.
          </DialogDescription>
        </DialogHeader>
        {/* Form, kapanınca silinen içeriğin içinde: state'i her açılışta sıfırdan başlar. */}
        <NewTagForm pending={pending} error={error} onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>
  );
}

function NewTagForm({
  pending,
  error,
  onSubmit,
}: {
  pending: boolean;
  error: string | null;
  onSubmit: (values: NewTagValues) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(color ? { name, color } : { name });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-2">
        <Label htmlFor="new-tag-name">Name</Label>
        <Input
          id="new-tag-name"
          required
          maxLength={40}
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label>Color</Label>
        <ColorPicker value={color} onChange={setColor} />
      </div>

      {/* Kaydetmeden önce etiketin board'da nasıl görüneceği. */}
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
          {pending ? "Creating..." : "Create tag"}
        </Button>
      </DialogFooter>
    </form>
  );
}
