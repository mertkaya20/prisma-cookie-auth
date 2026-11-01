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
import type { User } from "@/lib/types";

// person null ise dialog kapalı; hangi kişinin kapatılacağını da bu tutar.
export function DeactivatePersonDialog({
  person,
  onClose,
  pending,
  error,
  onConfirm,
}: {
  person: User | null;
  onClose: () => void;
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open={person !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="gap-6 p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Deactivate {person?.name}?
          </DialogTitle>
          <DialogDescription>
            They&apos;ll be logged out everywhere and can&apos;t log in. Their
            tasks, comments and team memberships stay, and you can activate them
            again at any time.
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
            {pending ? "Deactivating..." : "Deactivate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
