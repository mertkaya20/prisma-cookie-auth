"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2Icon } from "lucide-react";
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
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-6 p-6 sm:max-w-md">
        {/* Form, kapanınca silinen içeriğin içinde: alanlar ve eski hata her açılışta sıfırdan başlar. */}
        <ChangePasswordForm />
      </DialogContent>
    </Dialog>
  );
}

/*
 * İsteği burada atıyoruz, sayfada değil: sonucu uygulamada başka kimse kullanmıyor ve
 * cache'e dokunmuyor (kullanıcı aynı; yeni oturum cookie'sini tarayıcı kendisi kaydediyor).
 */
function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mismatch, setMismatch] = useState(false);

  const changePassword = useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      api("/auth/password", { method: "POST", body }),
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Tekrar alanı sadece yazım hatasına karşı: API'ye gitmez, burada kontrol edilir.
    if (newPassword !== confirmPassword) {
      setMismatch(true);
      return;
    }
    setMismatch(false);
    changePassword.mutate({ currentPassword, newPassword });
  }

  if (changePassword.isSuccess) {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <CheckCircle2Icon className="size-5 text-pine" aria-hidden />
            Password changed
          </DialogTitle>
          <DialogDescription>
            You&apos;re still logged in here. Any other devices were logged
            out and need the new password.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="-mx-6 -mb-6 px-6 py-4">
          <DialogClose render={<Button type="button" />}>Done</DialogClose>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold">
          Change password
        </DialogTitle>
        <DialogDescription>
          You&apos;ll stay logged in here. Other devices will be logged out.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid gap-2">
          <Label htmlFor="current-password">Current password</Label>
          <Input
            id="current-password"
            type="password"
            required
            autoFocus
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            required
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            aria-describedby="new-password-hint"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <p id="new-password-hint" className="text-xs text-ink-muted">
            At least 8 characters.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="confirm-password">Repeat new password</Label>
          <Input
            id="confirm-password"
            type="password"
            required
            autoComplete="new-password"
            aria-invalid={mismatch || undefined}
            aria-describedby={mismatch ? "confirm-password-error" : undefined}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setMismatch(false); // düzeltmeye başlayınca uyarı kalkar
            }}
          />
          {mismatch && (
            <p id="confirm-password-error" className="text-xs text-danger">
              The two new passwords don&apos;t match.
            </p>
          )}
        </div>

        {changePassword.error && (
          <Alert variant="destructive">
            <AlertDescription>
              {getErrorMessage(changePassword.error)}
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="-mx-6 -mb-6 px-6 py-4">
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button type="submit" disabled={changePassword.isPending}>
            {changePassword.isPending ? "Saving..." : "Change password"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
