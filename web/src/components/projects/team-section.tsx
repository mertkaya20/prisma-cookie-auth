"use client";

import { useState } from "react";
import { CheckIcon, ChevronDownIcon, PlusIcon, XIcon } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/format";
import type { Member, ProjectRole, User } from "@/lib/types";

const roleLabel: Record<ProjectRole, string> = {
  manager: "Manager",
  contributor: "Contributor",
};

const roleDescription: Record<ProjectRole, string> = {
  manager: "Manages the team and can delete tasks",
  contributor: "Creates and works on tasks",
};

// Projenin takımı. Ekleme, rol değiştirme ve çıkarma sadece owner ve projenin manager'ı için (API'deki MANAGE_ROLES).
export function TeamSection({
  members,
  users,
  meId,
  isOwner,
  canManage,
  onAdd,
  onChangeRole,
  onRemove,
  pending,
  error,
}: {
  members: Member[];
  users: User[];
  meId: string | undefined;
  isOwner: boolean;
  canManage: boolean;
  onAdd: (userId: string) => void;
  onChangeRole: (userId: string, role: ProjectRole) => void;
  onRemove: (userId: string) => void;
  pending: boolean;
  error: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [selfChange, setSelfChange] = useState<"remove" | "demote" | null>(
    null,
  );

  // Owner olmayan biri kendini çıkarır ya da contributor yaparsa takımı yönetme yetkisini kaybeder: önce sorulur.
  // Owner'a sorulmaz, çünkü owner takımda olmasa da her şeyi yönetebilir.
  const losesAccess = (userId: string) => userId === meId && !isOwner;

  function handleRemove(userId: string) {
    if (losesAccess(userId)) setSelfChange("remove");
    else onRemove(userId);
  }

  function handleChangeRole(userId: string, newRole: ProjectRole) {
    if (newRole === "contributor" && losesAccess(userId))
      setSelfChange("demote");
    else onChangeRole(userId, newRole);
  }

  function confirmSelfChange() {
    if (meId === undefined) return;
    if (selfChange === "remove") onRemove(meId);
    if (selfChange === "demote") onChangeRole(meId, "contributor");
    setSelfChange(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-ink-muted">
          Only people on the team can be assigned to this project&apos;s tasks.
        </p>
        {canManage && (
          <Button variant="outline" onClick={() => setOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            Add member
          </Button>
        )}
      </div>

      {error && !open && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {members.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-ink-muted">
          No one is on this project&apos;s team yet.
        </p>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
          {members.map((m) => (
            <li key={m.userId} className="flex items-center gap-3 px-4 py-3">
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white"
              >
                {initials(m.user.name)}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {m.user.name}
                  {m.userId === meId && (
                    <span className="font-normal text-ink-muted"> (you)</span>
                  )}
                </p>
                <p className="truncate text-xs text-ink-muted">
                  {m.user.email}
                </p>
              </div>

              {canManage ? (
                <RoleMenu
                  name={m.user.name}
                  role={m.role}
                  disabled={pending}
                  onChange={(role) => handleChangeRole(m.userId, role)}
                />
              ) : (
                <span className="shrink-0 text-ink-muted">
                  {roleLabel[m.role]}
                </span>
              )}

              {canManage && (
                <button
                  type="button"
                  onClick={() => handleRemove(m.userId)}
                  disabled={pending}
                  aria-label={`Remove ${m.user.name} from the team`}
                  className="-mr-1 shrink-0 rounded p-1 text-ink-muted outline-none hover:bg-wash hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                >
                  <XIcon className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-5 p-6 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Add members
            </DialogTitle>
            <DialogDescription>
              Anyone in your organization can join. New members start as
              contributors.
            </DialogDescription>
          </DialogHeader>

          <ul className="-mx-2 flex max-h-80 flex-col overflow-y-auto">
            {users.map((u) => {
              const isMember = members.some((m) => m.userId === u.id);

              return (
                <li
                  key={u.id}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{u.name}</p>
                    <p className="truncate text-xs text-ink-muted">{u.email}</p>
                  </div>
                  {isMember ? (
                    <span className="shrink-0 text-xs text-ink-muted">
                      On the team
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      disabled={pending}
                      onClick={() => onAdd(u.id)}
                    >
                      Add
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>

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

      <Dialog
        open={selfChange !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelfChange(null);
        }}
      >
        <DialogContent className="gap-6 p-6 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {selfChange === "remove"
                ? "Leave this team?"
                : "Step down to contributor?"}
            </DialogTitle>
            <DialogDescription>
              {selfChange === "remove"
                ? "You won't be able to work on this project's tasks or manage its team anymore."
                : "You won't be able to manage this team or delete tasks anymore."}{" "}
              Only the owner or another manager can undo this.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="-mx-6 -mb-6 px-6 py-4">
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              type="button"
              className="bg-danger text-white hover:bg-danger/90"
              onClick={confirmSelfChange}
            >
              {selfChange === "remove" ? "Leave team" : "Step down"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// StatusMenu ile aynı fikir: rolün adına tıklayınca iki rolü açıklamalarıyla listeleyen bir menü.
function RoleMenu({
  name,
  role,
  disabled,
  onChange,
}: {
  name: string;
  role: ProjectRole;
  disabled: boolean;
  onChange: (role: ProjectRole) => void;
}) {
  const roles: ProjectRole[] = ["manager", "contributor"];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        aria-label={`${name}'s role: ${roleLabel[role]}. Change role`}
        className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-ink-muted outline-none hover:bg-wash hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-expanded:bg-wash"
      >
        {roleLabel[role]}
        <ChevronDownIcon className="size-3.5" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {roles.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => {
              if (option !== role) onChange(option);
            }}
            className="items-start justify-between gap-3 py-2"
          >
            <span>
              <span className="block font-medium">{roleLabel[option]}</span>
              <span className="block text-xs text-ink-muted">
                {roleDescription[option]}
              </span>
            </span>
            {option === role && (
              <CheckIcon
                className="mt-0.5 text-ink-muted"
                aria-label="Current"
              />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
