"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { DeactivatedLabel } from "@/components/deactivated-label";
import { PageHeader } from "@/components/page-header";
import {
  AddPersonDialog,
  type NewPersonValues,
} from "@/components/people/add-person-dialog";
import { DeactivatePersonDialog } from "@/components/people/deactivate-person-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { initials } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { useMe } from "@/lib/session";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";

// Herkes listeyi görür; kişi eklemek sadece owner'ın (API'de requireRole("owner")).
export default function PeoplePage() {
  const me = useMe();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [deactivating, setDeactivating] = useState<User | null>(null);

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

  const deactivateUser = useMutation({
    mutationFn: (userId: string) =>
      api<{ user: User }>(`/users/${userId}/deactivate`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      setDeactivating(null);
    },
  });

  // Riski yok (kişi zaten yeniden giriş yapmak zorunda): onay sormadan.
  const activateUser = useMutation({
    mutationFn: (userId: string) =>
      api<{ user: User }>(`/users/${userId}/activate`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
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

  // API en yeni eklenenden başlayarak sıralıyor. Burada: etkinler önce, devre dışılar en altta;
  // her grupta önce owner'lar, sonra member'lar; aynı rolde isme göre.
  const people = [...(usersQuery.data?.users ?? [])].sort((a, b) => {
    if (!a.deactivatedAt !== !b.deactivatedAt) return a.deactivatedAt ? 1 : -1;
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

      {activateUser.error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            Couldn&apos;t activate this person.{" "}
            {getErrorMessage(activateUser.error)}
          </AlertDescription>
        </Alert>
      )}

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
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  person.deactivatedAt
                    ? "border border-dashed border-ink-muted text-ink-muted"
                    : "bg-ink text-white",
                )}
              >
                {initials(person.name)}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {person.name}
                  {person.id === me.data?.user.id && (
                    <span className="font-normal text-ink-muted"> (you)</span>
                  )}
                  {person.deactivatedAt && <DeactivatedLabel />}
                </p>
                <p className="truncate text-xs text-ink-muted">{person.email}</p>
              </div>

              <span className="shrink-0 text-sm text-ink-muted">
                {person.role === "owner" ? "Owner" : "Member"}
              </span>

              {/* Owner kendini kapatamaz (API'de CANNOT_DEACTIVATE_SELF); butonu hiç göstermiyoruz. */}
              {isOwner && person.id !== me.data?.user.id && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-24 shrink-0"
                  disabled={activateUser.isPending}
                  onClick={() => {
                    if (person.deactivatedAt) {
                      activateUser.mutate(person.id);
                    } else {
                      deactivateUser.reset();
                      setDeactivating(person);
                    }
                  }}
                >
                  {person.deactivatedAt ? "Activate" : "Deactivate"}
                </Button>
              )}
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

      <DeactivatePersonDialog
        person={deactivating}
        onClose={() => setDeactivating(null)}
        pending={deactivateUser.isPending}
        error={
          deactivateUser.error ? getErrorMessage(deactivateUser.error) : null
        }
        onConfirm={() => {
          if (deactivating) deactivateUser.mutate(deactivating.id);
        }}
      />
    </>
  );
}
