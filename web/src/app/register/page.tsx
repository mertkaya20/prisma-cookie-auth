"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthShell } from "@/components/auth-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";
import type { User } from "@/lib/types";
import { useMe } from "@/lib/session";
import { LoadingScreen } from "@/components/page-state";

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  organizationName: string;
};

const empty: RegisterInput = {
  name: "",
  email: "",
  password: "",
  organizationName: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState(empty);
  const me = useMe();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (me.data) router.replace("/app");
  }, [me.data, router]);

  const register = useMutation({
    mutationFn: (body: RegisterInput) =>
      api<{ user: User }>("/auth/register", { method: "POST", body }),
    // Kayıt aynı zamanda giriş yapar (API cookie'yi koyar).
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.me, data);
      router.push("/app");
    },
  });

  const update =
    (field: keyof RegisterInput) =>
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((current) => ({ ...current, [field]: event.target.value }));

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    register.mutate(form);
  }

  // Oturum beklenirken form gösterilir (Render uyuyor olabilir); giriş yapmışsa yönlendirme sürer.
  if (me.data) {
    return <LoadingScreen />;
  }

  return (
    <AuthShell
      title="Create your account"
      description="You'll be the owner of a new organization and can invite your team next."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-pine underline-offset-4 hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid gap-2">
          <Label htmlFor="name">Your name</Label>
          <Input
            id="name"
            required
            maxLength={50}
            autoComplete="name"
            value={form.name}
            onChange={update("name")}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={update("email")}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            aria-describedby="password-hint"
            value={form.password}
            onChange={update("password")}
          />
          <p id="password-hint" className="text-sm text-ink-muted">
            At least 8 characters.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="organizationName">Organization name</Label>
          <Input
            id="organizationName"
            required
            maxLength={72}
            autoComplete="organization"
            aria-describedby="organization-hint"
            value={form.organizationName}
            onChange={update("organizationName")}
          />
          <p id="organization-hint" className="text-sm text-ink-muted">
            The name of your team or company.
          </p>
        </div>

        {register.error && (
          <Alert variant="destructive">
            <AlertDescription>
              {getErrorMessage(register.error)}
            </AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={register.isPending}
          className="mt-1"
        >
          {register.isPending ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
