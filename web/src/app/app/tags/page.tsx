"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/page-state";
import { TagChip } from "@/components/tag-chip";
import { DeleteTagDialog } from "@/components/tags/delete-tag-dialog";
import {
  EditTagDialog,
  type EditTagValues,
} from "@/components/tags/edit-tag-dialog";
import {
  NewTagDialog,
  type NewTagValues,
} from "@/components/tags/new-tag-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";
import { useMe } from "@/lib/session";
import type { TagSummary } from "@/lib/types";

/*
 * Yetkiler (API'deki tags.routes ile aynı):
 *   oluşturmak ve düzenlemek: organizasyondaki herkes · silmek: sadece owner
 *
 * Etiketler görevlerde de görünüyor (board, görev sayfası, My tasks). Orada ayrıca invalidate gerekmiyor:
 * o sayfalar şu an ekranda değil ve açıldıklarında verilerini zaten yeniden çekiyorlar.
 */
export default function TagsPage() {
  const me = useMe();
  const queryClient = useQueryClient();
  const [newOpen, setNewOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagSummary | null>(null);
  const [deletingTag, setDeletingTag] = useState<TagSummary | null>(null);

  const isOwner = me.data?.user.role === "owner";

  const tagsQuery = useQuery({
    queryKey: queryKeys.tags,
    queryFn: () => api<{ tags: TagSummary[] }>("/tags"),
  });

  const createTag = useMutation({
    mutationFn: (body: NewTagValues) =>
      api<{ tag: TagSummary }>("/tags", { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags });
      setNewOpen(false);
    },
  });

  const updateTag = useMutation({
    mutationFn: ({ tagId, body }: { tagId: string; body: EditTagValues }) =>
      api<{ tag: TagSummary }>(`/tags/${tagId}`, { method: "PATCH", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags });
      setEditingTag(null);
    },
  });

  const deleteTag = useMutation({
    mutationFn: (tagId: string) => api(`/tags/${tagId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags });
      setDeletingTag(null);
    },
  });

  function openNew() {
    createTag.reset();
    setNewOpen(true);
  }

  const newTagButton = (
    <Button onClick={openNew}>
      <PlusIcon data-icon="inline-start" />
      New tag
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Tags"
        description="Labels your team uses to group tasks."
        actions={newTagButton}
      />

      {tagsQuery.isPending ? (
        <div aria-hidden className="h-48 animate-pulse rounded-xl bg-wash" />
      ) : tagsQuery.error ? (
        <Alert variant="destructive">
          <AlertDescription>{getErrorMessage(tagsQuery.error)}</AlertDescription>
        </Alert>
      ) : tagsQuery.data.tags.length === 0 ? (
        <EmptyState
          title="No tags yet"
          description="Create tags like “bug” or “design”, then add them to tasks."
          action={newTagButton}
        />
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
          {tagsQuery.data.tags.map((tag) => (
            <li key={tag.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <TagChip name={tag.name} color={tag.color} />
              </div>

              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Edit ${tag.name}`}
                className="text-ink-muted"
                onClick={() => {
                  updateTag.reset();
                  setEditingTag(tag);
                }}
              >
                <PencilIcon />
              </Button>

              {isOwner && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${tag.name}`}
                  className="text-ink-muted hover:bg-danger/10 hover:text-danger"
                  onClick={() => {
                    deleteTag.reset();
                    setDeletingTag(tag);
                  }}
                >
                  <Trash2Icon />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <NewTagDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        pending={createTag.isPending}
        error={createTag.error ? getErrorMessage(createTag.error) : null}
        onSubmit={(values) => createTag.mutate(values)}
      />

      <EditTagDialog
        tag={editingTag}
        onClose={() => setEditingTag(null)}
        pending={updateTag.isPending}
        error={updateTag.error ? getErrorMessage(updateTag.error) : null}
        onSubmit={(values) => {
          if (editingTag) updateTag.mutate({ tagId: editingTag.id, body: values });
        }}
      />

      <DeleteTagDialog
        tag={deletingTag}
        onClose={() => setDeletingTag(null)}
        pending={deleteTag.isPending}
        error={deleteTag.error ? getErrorMessage(deleteTag.error) : null}
        onConfirm={() => {
          if (deletingTag) deleteTag.mutate(deletingTag.id);
        }}
      />
    </>
  );
}
