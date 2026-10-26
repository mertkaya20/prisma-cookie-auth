import Link from "next/link";
import { Logo } from "@/components/logo";
import { StatusRing } from "@/components/status-ring";
import { buttonVariants } from "@/components/ui/button";
import type { TaskStatus } from "@/lib/types";

const states: TaskStatus[] = ["todo", "in_progress", "done"];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-6 sm:px-8">
        <Logo />
        <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
          Log in
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 pb-24 sm:px-8">
        <div className="flex items-center gap-4" aria-hidden>
          {states.map((status) => (
            <StatusRing
              key={status}
              status={status}
              className="size-10 sm:size-12"
            />
          ))}
        </div>

        <h1 className="mt-10 max-w-2xl text-[2.5rem] leading-[1.1] font-semibold tracking-tight text-balance sm:text-[3.25rem]">
          See what your team is working on, and move it forward.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-ink-muted">
          Organize work into projects, assign tasks to the people on each
          project, and follow every task until it&apos;s done.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/register" className={buttonVariants({ size: "lg" })}>
            Create an account
          </Link>
          <Link
            href="/login"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            Log in
          </Link>
        </div>
      </main>
    </div>
  );
}
