import { PlusIcon, XIcon } from "lucide-react";
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
import { DetailRow } from "./task-details";
import { useState } from "react";
import type { Member, User } from "@/lib/types";

export function AssigneesSection({
  assignees,
  canAssign,
  members,
  onAssign,
  onUnassign,
  pending,
  error,
}: {
  assignees: { user: User }[];
  canAssign: boolean;
  members: Member[];
  onAssign: (userId: string) => void;
  onUnassign: (userId: string) => void;
  pending: boolean;
  error: string | null;
}) {
  const [open, setOpen] = useState(false);
  return (
    <dl className="rounded-xl border border-line bg-surface text-sm">
      <DetailRow label="Assignees" alignTop>
        <div className="flex flex-col gap-2 py-0.5">
          {assignees.length === 0 ? (
            <p className="text-ink-muted">No one assigned</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {assignees.map((a) => (
                <li
                  key={a.user.id}
                  className="flex items-start justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{a.user.name}</p>
                    <p className="truncate text-xs text-ink-muted">
                      {a.user.email}
                    </p>
                  </div>
                  {canAssign && (
                    <button
                      type="button"
                      onClick={() => onUnassign(a.user.id)}
                      disabled={pending}
                      aria-label={`Remove ${a.user.name}`}
                      className="-mr-1 shrink-0 rounded p-1 text-ink-muted outline-none hover:bg-wash hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                    >
                      <XIcon className="size-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {canAssign && (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2.5 self-start"
              onClick={() => setOpen(true)}
            >
              <PlusIcon data-icon="inline-start" />
              Assign
            </Button>
          )}

          {/* Modal'ın dışında da görünsün: ✕ ile kaldırma başarısız olursa. */}
          {error && !open && <p className="text-xs text-danger">{error}</p>}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="gap-5 p-6 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                Assign people
              </DialogTitle>
              <DialogDescription>
                Only people on the project team can be assigned.
              </DialogDescription>
            </DialogHeader>

            {members.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-ink-muted">
                No one is on this project&apos;s team yet.
              </p>
            ) : (
              <ul className="-mx-2 flex max-h-80 flex-col overflow-y-auto">
                {members.map((m) => {
                  const isAssigned = assignees.some(
                    (a) => a.user.id === m.userId,
                  );
                  return (
                    <li
                      key={m.userId}
                      className="flex items-center justify-between gap-3 rounded-lg px-2 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{m.user.name}</p>
                        <p className="truncate text-xs text-ink-muted">
                          {m.user.email}
                        </p>
                      </div>
                      {isAssigned ? (
                        <span className="shrink-0 text-xs text-ink-muted">
                          Already assigned
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0"
                          disabled={pending}
                          onClick={() => onAssign(m.userId)}
                        >
                          Assign
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter className="-mx-6 -mb-6 px-6 py-4">
              <DialogClose render={<Button type="button" />}>Done</DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DetailRow>
    </dl>
  );
}
