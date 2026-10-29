"use client";

import { TagChip } from "@/components/tag-chip";
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
import type { TagSummary } from "@/lib/types";

// Etiket silinince bütün görevlerden de kalkar (veritabanında Cascade); görevlerin kendisi silinmez.
export function DeleteTagDialog({
  tag,
  onClose,
  pending,
  error,
  onConfirm,
}: {
  tag: TagSummary | null;
  onClose: () => void;
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
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
          <DialogTitle className="text-lg font-semibold">
            Delete this tag?
          </DialogTitle>
          <DialogDescription>
            It will be removed from every task that has it. The tasks
            themselves stay. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>

        {/* Dialog'un içi grid: sarmalayıcı olmadan rozet bütün genişliğe yayılır. */}
        {tag && (
          <div>
            <TagChip name={tag.name} color={tag.color} />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter className="-mx-6 -mb-6 px-6 py-4">
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="bg-danger text-white hover:bg-danger/90"
          >
            {pending ? "Deleting..." : "Delete tag"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
