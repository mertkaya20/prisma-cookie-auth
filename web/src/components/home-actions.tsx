"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { useMe } from "@/lib/session";
import { cn } from "@/lib/utils";

// Ana sayfanın oturuma göre değişen butonları. Sayfanın geri kalanı sunucuda kalır.

export function HeaderAction() {
  const me = useMe();

  // Oturum belli olana kadar aynı genişlikte görünmez bir yer tutucu: buton zıplamasın.
  if (me.isPending) {
    return <span aria-hidden className={cn(buttonVariants({ variant: "ghost" }), "invisible")}>Log in</span>;
  }
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

  if (me.isPending) {
    return (
      <div aria-hidden className="invisible flex gap-3">
        <span className={buttonVariants({ size: "lg" })}>Create an account</span>
      </div>
    );
  }
  if (me.data) {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <Link href="/app" className={buttonVariants({ size: "lg" })}>
          Open Halfway
        </Link>
        <p className="text-sm text-ink-muted">Logged in as {me.data.user.name}</p>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-3">
      <Link href="/register" className={buttonVariants({ size: "lg" })}>
        Create an account
      </Link>
      <Link href="/login" className={buttonVariants({ size: "lg", variant: "outline" })}>
        Log in
      </Link>
    </div>
  );
}
