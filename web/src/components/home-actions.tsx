"use client";

import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";
import { DEMO_NOTE, DEMO_WAKING_NOTE, useMe, useTryDemo } from "@/lib/session";

// Ana sayfanın oturuma göre değişen butonları. Sayfanın geri kalanı sunucuda kalır.

export function HeaderAction() {
  const me = useMe();

  // Oturum belli olana kadar giriş yapmamış hali gösterilir: Render uyuyorsa
  // /auth/me bir dakika sürebilir, ziyaretçi o sırada butonsuz kalmasın.
  if (me.data) {
    return (
      <Link href="/app" className={buttonVariants({ variant: "ghost" })}>
        Open Halfway
      </Link>
    );
  }
  return (
    <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
      Log in
    </Link>
  );
}

export function HeroActions() {
  const me = useMe();

  if (me.data) {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <Link href="/app" className={buttonVariants({ size: "lg" })}>
          Open Halfway
        </Link>
        <p className="text-sm text-ink-muted">
          Logged in as {me.data.user.name}
        </p>
      </div>
    );
  }
  return <LoggedOutHeroActions />;
}

function LoggedOutHeroActions() {
  const demo = useTryDemo();

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <Button
          size="lg"
          disabled={demo.isPending}
          onClick={() => demo.mutate()}
        >
          {demo.isPending ? "Setting up your demo..." : "Try the demo"}
        </Button>
        <Link
          href="/register"
          className={buttonVariants({ size: "lg", variant: "outline" })}
        >
          Create an account
        </Link>
      </div>
      <p className="mt-3 text-sm text-ink-muted">
        {demo.isPending ? DEMO_WAKING_NOTE : DEMO_NOTE}
      </p>
      {demo.error && (
        <Alert variant="destructive" className="mt-3 max-w-md">
          <AlertDescription>{getErrorMessage(demo.error)}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
