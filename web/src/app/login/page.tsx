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
import {
  DEMO_NOTE,
  DEMO_WAKING_NOTE,
  useMe,
  useTryDemo,
} from "@/lib/session";
import { LoadingScreen } from "@/components/page-state";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const me = useMe();
  const queryClient = useQueryClient();
  const demo = useTryDemo();

  useEffect(() => {
    if (me.data) router.replace("/app");
  }, [me.data, router]);

  const {
    error: mutateError,
    isPending,
    mutate,
  } = useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      api<{ user: User }>("/auth/login", { method: "POST", body }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.me, data);
      router.push("/app");
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    mutate({ email, password });
  }

  // Oturum beklenirken form gösterilir (Render uyuyor olabilir); giriş yapmışsa yönlendirme sürer.
  if (me.data) {
    return <LoadingScreen />;
  }

  return (
    <AuthShell
      title="Log in"
      description="Welcome back. Pick up where your team left off."
      footer={
        <>
          No account yet?{" "}
          <Link
            href="/register"
            className="font-medium text-pine underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {mutateError && (
          <Alert variant="destructive">
            <AlertDescription>{getErrorMessage(mutateError)}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" size="lg" disabled={isPending} className="mt-1">
          {isPending ? "Logging in..." : "Log in"}
        </Button>
      </form>

      <div className="mt-6 flex items-center gap-3 text-xs text-ink-muted">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <Button
        variant="outline"
        size="lg"
        disabled={demo.isPending}
        onClick={() => demo.mutate()}
        className="mt-6 w-full"
      >
        {demo.isPending ? "Setting up your demo..." : "Try the demo"}
      </Button>
      <p className="mt-2 text-sm text-ink-muted">
        {demo.isPending ? DEMO_WAKING_NOTE : DEMO_NOTE}
      </p>
      {demo.error && (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>{getErrorMessage(demo.error)}</AlertDescription>
        </Alert>
      )}
    </AuthShell>
  );
}
