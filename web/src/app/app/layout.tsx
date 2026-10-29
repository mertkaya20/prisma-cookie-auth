"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { ErrorScreen, LoadingScreen } from "@/components/page-state";
import { api, ApiError } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";

import { useMe } from "@/lib/session";

// /app altındaki her sayfa buradan geçer: önce "giriş yapmış mı?" kontrolü.
export default function AppLayout({ children }: LayoutProps<"/app">) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const me = useMe();

  const unauthorized = me.error instanceof ApiError && me.error.status === 401;

  useEffect(() => {
    if (unauthorized) router.replace("/login");
  }, [unauthorized, router]);

  const logout = useMutation({
    mutationFn: () => api("/auth/logout", { method: "POST" }),
    onSuccess: () => {
      queryClient.clear();
      router.replace("/login");
    },
  });
  if (me.isPending || unauthorized) {
    return <LoadingScreen />;
  }

  if (me.error) {
    return (
      <ErrorScreen
        message={getErrorMessage(me.error)}
        onRetry={() => me.refetch()}
      />
    );
  }

  return (
    <AppShell
      user={me.data.user}
      onLogout={() => logout.mutate()}
      loggingOut={logout.isPending}
      logoutError={logout.error ? getErrorMessage(logout.error) : null}
    >
      {children}
    </AppShell>
  );
}
