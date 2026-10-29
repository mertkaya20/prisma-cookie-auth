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
} from "../ui/dialog";
import { DetailRow } from "./task-details";
import { useState } from "react";
import type { TagSummary } from "@/lib/types";
import { TagChip } from "../tag-chip";

export function TagsSection({
  tags,
  orgTags,
  canEdit,
  onAddTag,
  onRemoveTag,
  pending,
  error,
}: {
  tags: { tag: TagSummary }[];
  orgTags: TagSummary[];
  canEdit: boolean;
  onAddTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
  pending: boolean;
  error: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <dl className="rounded-xl border border-line bg-surface text-sm">
      <DetailRow label="Tags" alignTop>
        <div className="flex flex-col gap-2 py-0.5">
          {tags.length === 0 ? (
            <p className="text-ink-muted">No tags</p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <li key={t.tag.id} className="flex items-center gap-0.5">
                  <TagChip name={t.tag.name} color={t.tag.color} />
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => onRemoveTag(t.tag.id)}
                      disabled={pending}
                      aria-label={`Remove ${t.tag.name}`}
                      className="shrink-0 rounded p-0.5 text-ink-muted outline-none hover:bg-wash hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2.5 self-start"
              onClick={() => setOpen(true)}
            >
              <PlusIcon data-icon="inline-start" />
              Add tag
            </Button>
          )}

          {error && !open && <p className="text-xs text-danger">{error}</p>}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="gap-5 p-6 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                Add tag
              </DialogTitle>
              <DialogDescription>
                Tags are shared across your organization.
              </DialogDescription>
            </DialogHeader>
            {orgTags.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-ink-muted">
                Your organization has no tags yet.
              </p>
            ) : (
              <ul className="-mx-2 flex max-h-80 flex-col overflow-y-auto">
                {orgTags.map((ot) => {
                  const isAdded = tags.some((t) => t.tag.id === ot.id);

                  return (
                    <li
                      key={ot.id}
                      className="flex items-center justify-between gap-3 rounded-lg px-2 py-2"
                    >
                      <TagChip name={ot.name} color={ot.color} />
                      {isAdded ? (
                        <span className="shrink-0 text-xs text-ink-muted">
                          Added
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0"
                          disabled={pending}
                          onClick={() => onAddTag(ot.id)}
                        >
                          Add
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
