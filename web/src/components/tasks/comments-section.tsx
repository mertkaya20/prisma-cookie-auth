"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DeactivatedLabel } from "@/components/deactivated-label";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { formatCommentTime, initials } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import type { TaskComment } from "@/lib/types";

/*
 * Yorumlar görevle birlikte gelmiyor, kendi isteği var ve sayfada başka kimse kullanmıyor.
 * Bu yüzden atananlar/etiketlerin aksine sorgu ve mutation'lar sayfada değil, burada.
 *
 * Yetkiler (API'deki comments.service ile aynı):
 *   yazmak: ekip (canComment) · düzenlemek: sadece yazarı · silmek: yazarı ya da owner/manager (canModerate)
 */
export function CommentsSection({
  taskId,
  meId,
  canComment,
  canModerate,
}: {
  taskId: string;
  meId: string | undefined;
  canComment: boolean;
  canModerate: boolean;
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const commentsQuery = useQuery({
    queryKey: queryKeys.taskComments(taskId),
    queryFn: () =>
      api<{ comments: TaskComment[] }>(`/tasks/${taskId}/comments`),
  });

  // Board'da yorum görünmüyor: sadece bu listenin yenilenmesi yeterli.
  const refreshComments = () =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.taskComments(taskId),
    });

  const createComment = useMutation({
    mutationFn: (body: string) =>
      api<{ comment: TaskComment }>(`/tasks/${taskId}/comments`, {
        method: "POST",
        body: { body },
      }),
    onSuccess: refreshComments,
  });

  const updateComment = useMutation({
    mutationFn: ({ commentId, body }: { commentId: string; body: string }) =>
      api<{ comment: TaskComment }>(`/comments/${commentId}`, {
        method: "PATCH",
        body: { body },
      }),
    onSuccess: refreshComments,
  });

  const deleteComment = useMutation({
    mutationFn: (commentId: string) =>
      api(`/comments/${commentId}`, { method: "DELETE" }),
    onSuccess: refreshComments,
  });

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Hook'taki onSuccess veriyi yeniler; buradaki onSuccess sadece bu ekranı toparlar.
    createComment.mutate(draft.trim(), { onSuccess: () => setDraft("") });
  }

  const comments = commentsQuery.data?.comments ?? [];

  return (
    <section
      aria-labelledby="comments-heading"
      className="max-w-[70ch] border-t border-line pt-8"
    >
      <h2
        id="comments-heading"
        className="flex items-center gap-2 text-base font-semibold"
      >
        Comments
        {comments.length > 0 && (
          <span className="font-normal text-ink-muted tabular-nums">
            {comments.length}
          </span>
        )}
      </h2>

      {commentsQuery.isPending ? (
        <div aria-hidden className="mt-4 flex flex-col gap-4">
          <div className="h-12 animate-pulse rounded-lg bg-wash" />
          <div className="h-12 animate-pulse rounded-lg bg-wash" />
        </div>
      ) : commentsQuery.error ? (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>
            Couldn&apos;t load comments. {getErrorMessage(commentsQuery.error)}
          </AlertDescription>
        </Alert>
      ) : comments.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">No comments yet.</p>
      ) : (
        <ul className="mt-5 flex flex-col gap-6">
          {comments.map((comment) => {
            const isAuthor = comment.author.id === meId;
            const canDeleteThis = isAuthor || canModerate;
            const isEditing = editingId === comment.id;

            return (
              <li key={comment.id} className="flex gap-3">
                <span
                  aria-hidden
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-semibold",
                    comment.author.deactivatedAt
                      ? "border border-dashed border-ink-muted text-ink-muted"
                      : "bg-ink text-white",
                  )}
                >
                  {initials(comment.author.name)}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
                    <span className="font-medium">
                      {comment.author.name}
                      {comment.author.deactivatedAt && <DeactivatedLabel />}
                    </span>
                    <time
                      dateTime={comment.createdAt}
                      className="text-xs text-ink-muted"
                    >
                      {formatCommentTime(comment.createdAt)}
                    </time>
                    {isEdited(comment) && (
                      <span className="text-xs text-ink-muted">(edited)</span>
                    )}
                  </p>

                  {isEditing ? (
                    <EditCommentForm
                      comment={comment}
                      pending={updateComment.isPending}
                      error={
                        updateComment.error
                          ? getErrorMessage(updateComment.error)
                          : null
                      }
                      onCancel={() => setEditingId(null)}
                      onSave={(body) =>
                        updateComment.mutate(
                          { commentId: comment.id, body },
                          { onSuccess: () => setEditingId(null) },
                        )
                      }
                    />
                  ) : (
                    <>
                      <p className="mt-1 text-sm leading-relaxed break-words whitespace-pre-wrap">
                        {comment.body}
                      </p>

                      {(isAuthor || canDeleteThis) && (
                        <div className="mt-1 -ml-2 flex gap-1">
                          {isAuthor && (
                            <Button
                              variant="ghost"
                              size="xs"
                              className="text-ink-muted"
                              onClick={() => {
                                updateComment.reset();
                                setEditingId(comment.id);
                              }}
                            >
                              Edit
                            </Button>
                          )}
                          {canDeleteThis && (
                            <Button
                              variant="ghost"
                              size="xs"
                              className="text-ink-muted hover:bg-danger/10 hover:text-danger"
                              onClick={() => {
                                deleteComment.reset();
                                setDeletingId(comment.id);
                              }}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {canComment && (
        <form onSubmit={handleCreate} className="mt-8 flex flex-col gap-3">
          <Label htmlFor="new-comment" className="sr-only">
            Add a comment
          </Label>
          <Textarea
            id="new-comment"
            placeholder="Write a comment…"
            rows={3}
            maxLength={2000}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />

          {createComment.error && (
            <Alert variant="destructive">
              <AlertDescription>
                {getErrorMessage(createComment.error)}
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="self-end"
            disabled={createComment.isPending || draft.trim() === ""}
          >
            {createComment.isPending ? "Posting..." : "Comment"}
          </Button>
        </form>
      )}

      <Dialog
        open={deletingId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null);
        }}
      >
        <DialogContent className="gap-6 p-6 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Delete this comment?
            </DialogTitle>
            <DialogDescription>This can&apos;t be undone.</DialogDescription>
          </DialogHeader>

          {deleteComment.error && (
            <Alert variant="destructive">
              <AlertDescription>
                {getErrorMessage(deleteComment.error)}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="-mx-6 -mb-6 px-6 py-4">
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              type="button"
              disabled={deleteComment.isPending}
              className="bg-danger text-white hover:bg-danger/90"
              onClick={() => {
                if (deletingId === null) return;
                deleteComment.mutate(deletingId, {
                  onSuccess: () => setDeletingId(null),
                });
              }}
            >
              {deleteComment.isPending ? "Deleting..." : "Delete comment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

// Düzenle'ye basınca açılır, yorumun o anki metniyle başlar (EditTaskForm ile aynı fikir).
function EditCommentForm({
  comment,
  pending,
  error,
  onCancel,
  onSave,
}: {
  comment: TaskComment;
  pending: boolean;
  error: string | null;
  onCancel: () => void;
  onSave: (body: string) => void;
}) {
  const [body, setBody] = useState(comment.body);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(body.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-3">
      <Label htmlFor={`edit-comment-${comment.id}`} className="sr-only">
        Edit comment
      </Label>
      <Textarea
        id={`edit-comment-${comment.id}`}
        autoFocus
        rows={3}
        maxLength={2000}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={pending || body.trim() === ""}
        >
          {pending ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}

// Oluştururken createdAt ve updatedAt birkaç milisaniye farklı yazılabiliyor; 1 saniyeden azı düzenleme sayılmaz.
function isEdited(comment: TaskComment) {
  return (
    new Date(comment.updatedAt).getTime() -
      new Date(comment.createdAt).getTime() >
    1000
  );
}
