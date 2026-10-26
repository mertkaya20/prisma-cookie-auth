import Link from "next/link";
import { Logo } from "@/components/logo";
import { StatusRing } from "@/components/status-ring";
import { TagChip } from "@/components/tag-chip";
import type { TaskStatus } from "@/lib/types";

const preview: {
  title: string;
  status: TaskStatus;
  tag: { name: string; color: string };
}[] = [
  {
    title: "Plan the Q1 roadmap",
    status: "todo",
    tag: { name: "planning", color: "#7c5cbf" },
  },
  {
    title: "Review the pricing page",
    status: "in_progress",
    tag: { name: "design", color: "#d4a017" },
  },
  {
    title: "Draft the launch checklist",
    status: "done",
    tag: { name: "launch", color: "#2f80c1" },
  },
];

// Giriş ve kayıt sayfalarının ortak çerçevesi: solda ürün, sağda form.
export function AuthShell({
  title,
  description,
  footer,
  children,
}: {
  title: string;
  description: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_minmax(26rem,32rem)]">
      <aside className="hidden flex-col justify-between border-r border-line p-12 lg:flex">
        <Link href="/" className="self-start">
          <Logo />
        </Link>

        <div className="max-w-md">
          <p className="text-[1.5625rem] leading-snug font-medium text-balance">
            Projects, tasks and the people doing them, in one place.
          </p>
          <ul className="mt-8 divide-y divide-line border-y border-line">
            {preview.map((task) => (
              <li key={task.title} className="flex items-center gap-3 py-3">
                <StatusRing status={task.status} />
                <span
                  className={
                    task.status === "done"
                      ? "text-ink-muted line-through decoration-line"
                      : undefined
                  }
                >
                  {task.title}
                </span>
                <TagChip
                  name={task.tag.name}
                  color={task.tag.color}
                  className="ml-auto"
                />
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-ink-muted">Built for small teams.</p>
      </aside>

      <main className="flex flex-col justify-center bg-surface px-4 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link
            href="/"
            className="mb-10 inline-block lg:hidden"
          >
            <Logo />
          </Link>
          <h1 className="text-[1.5625rem] font-semibold tracking-tight">
            {title}
          </h1>
          <p className="mt-1.5 text-ink-muted">{description}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-8 text-sm text-ink-muted">{footer}</p>
        </div>
      </main>
    </div>
  );
}
