"use client";

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

// Proje silinince görevleri, yorumları ve takımı da silinir (veritabanında Cascade). Bu yüzden ne gideceği açıkça yazılır.
export function DeleteProjectDialog({
  open,
  onOpenChange,
  projectName,
  taskCount,
  pending,
  error,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  taskCount: number | undefined;
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
}) {
  const tasks =
    taskCount === undefined
      ? "all of its tasks"
      : taskCount === 1
        ? "its 1 task"
        : `its ${taskCount} tasks`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-6 p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Delete this project?
          </DialogTitle>
          <DialogDescription>
            &ldquo;{projectName}&rdquo; will be deleted together with {tasks},
            their comments and the team list. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>

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
            {pending ? "Deleting..." : "Delete project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
