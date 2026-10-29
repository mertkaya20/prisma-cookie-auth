"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";

// API'deki createUserSchema.
export type NewPersonValues = {
  name: string;
  email: string;
  password: string;
  role: User["role"];
};

const roles: { value: User["role"]; label: string; description: string }[] = [
  {
    value: "member",
    label: "Member",
    description: "Works on the projects they're added to",
  },
  {
    value: "owner",
    label: "Owner",
    description: "Manages projects, people and tags",
  },
];

export function AddPersonDialog({
  open,
  onOpenChange,
  pending,
  error,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  error: string | null;
  onSubmit: (values: NewPersonValues) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-6 p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Add a person</DialogTitle>
          <DialogDescription>
            They log in with this email and password. Share the password with
            them privately; there are no invite emails yet.
          </DialogDescription>
        </DialogHeader>
        {/* Form, kapanınca silinen içeriğin içinde: state'i her açılışta sıfırdan başlar. */}
        <AddPersonForm pending={pending} error={error} onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>
  );
}

function AddPersonForm({
  pending,
  error,
  onSubmit,
}: {
  pending: boolean;
  error: string | null;
  onSubmit: (values: NewPersonValues) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<User["role"]>("member");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({ name, email, password, role });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-2">
        <Label htmlFor="person-name">Name</Label>
        <Input
          id="person-name"
          required
          maxLength={50}
          autoFocus
          autoComplete="off"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="person-email">Email</Label>
        <Input
          id="person-email"
          type="email"
          required
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="person-password">Starting password</Label>
        {/* Gizli değil: owner bu şifreyi karşı tarafa iletecek, yazım hatası yapmadığını görmeli. */}
        <Input
          id="person-password"
          type="text"
          required
          minLength={8}
          maxLength={72}
          autoComplete="off"
          spellCheck={false}
          aria-describedby="person-password-hint"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p id="person-password-hint" className="text-xs text-ink-muted">
          At least 8 characters.
        </p>
      </div>

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">Role</legend>
        {roles.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border border-line px-3 py-2.5 text-sm",
              role === option.value && "border-ink",
            )}
          >
            <input
              type="radio"
              name="role"
              value={option.value}
              checked={role === option.value}
              onChange={() => setRole(option.value)}
              className="mt-0.5 accent-ink"
            />
            <span>
              <span className="block font-medium">{option.label}</span>
              <span className="block text-xs text-ink-muted">
                {option.description}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <DialogFooter className="-mx-6 -mb-6 px-6 py-4">
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancel
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "Adding..." : "Add person"}
        </Button>
      </DialogFooter>
    </form>
  );
}
