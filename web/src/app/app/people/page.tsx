"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import {
  AddPersonDialog,
  type NewPersonValues,
} from "@/components/people/add-person-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { initials } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { useMe } from "@/lib/session";
import type { User } from "@/lib/types";

// Herkes listeyi görür; kişi eklemek sadece owner'ın (API'de requireRole("owner")).
export default function PeoplePage() {
  const me = useMe();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const isOwner = me.data?.user.role === "owner";

  // Takım sekmesindeki "Add members" penceresi de aynı anahtarı kullanıyor: eklenen kişi orada da görünür.
  const usersQuery = useQuery({
    queryKey: queryKeys.users,
    queryFn: () => api<{ users: User[] }>("/users"),
  });

  const createUser = useMutation({
    mutationFn: (body: NewPersonValues) =>
      api<{ user: User }>("/users", { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      setAddOpen(false);
    },
  });

  // EMAIL_TAKEN'ın genel mesajı ("Log in instead") kayıt sayfası için; burada başkası ekleniyor.
  const createError =
    createUser.error instanceof ApiError &&
    createUser.error.code === "EMAIL_TAKEN"
      ? "Someone with this email already has an account."
      : createUser.error
        ? getErrorMessage(createUser.error)
        : null;

  // API en yeni eklenenden başlayarak sıralıyor. Burada: önce owner'lar, sonra member'lar; her grup kendi içinde isme göre.
  const people = [...(usersQuery.data?.users ?? [])].sort((a, b) => {
    if (a.role !== b.role) return a.role === "owner" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <>
      <PageHeader
        title="People"
        description="Everyone in your organization."
        actions={
          isOwner && (
            <Button
              onClick={() => {
                createUser.reset();
                setAddOpen(true);
              }}
            >
              <PlusIcon data-icon="inline-start" />
              Add person
            </Button>
          )
        }
      />

      {usersQuery.isPending ? (
        <div aria-hidden className="h-48 animate-pulse rounded-xl bg-wash" />
      ) : usersQuery.error ? (
        <Alert variant="destructive">
          <AlertDescription>{getErrorMessage(usersQuery.error)}</AlertDescription>
        </Alert>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
          {people.map((person) => (
            <li key={person.id} className="flex items-center gap-3 px-4 py-3">
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white"
              >
                {initials(person.name)}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {person.name}
                  {person.id === me.data?.user.id && (
                    <span className="font-normal text-ink-muted"> (you)</span>
                  )}
                </p>
                <p className="truncate text-xs text-ink-muted">{person.email}</p>
              </div>

              <span className="shrink-0 text-sm text-ink-muted">
                {person.role === "owner" ? "Owner" : "Member"}
              </span>
            </li>
          ))}
        </ul>
      )}

      <AddPersonDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        pending={createUser.isPending}
        error={createError}
        onSubmit={(values) => createUser.mutate(values)}
      />
    </>
  );
}
