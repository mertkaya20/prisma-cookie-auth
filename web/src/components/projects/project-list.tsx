import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import type { Project } from "@/lib/types";

const dateFormat = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

// Projeler kart yığını değil, çizgilerle ayrılmış bir liste: isim, açıklama, oluşturulma tarihi.
export function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
      {projects.map((project) => (
        <li key={project.id}>
          <Link
            href={`/app/projects/${project.id}`}
            className="group flex items-center gap-4 px-5 py-4 transition-colors outline-none hover:bg-wash/60 focus-visible:bg-wash"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{project.name}</p>
              <p className="mt-0.5 truncate text-sm text-ink-muted">
                {project.description ?? "No description"}
              </p>
            </div>
            <time
              dateTime={project.createdAt}
              className="hidden shrink-0 text-sm text-ink-muted tabular-nums sm:block"
            >
              Created {dateFormat.format(new Date(project.createdAt))}
            </time>
            <ChevronRightIcon className="size-4 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function ProjectListSkeleton() {
  return (
    <ul
      aria-hidden
      className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface"
    >
      {[0, 1, 2].map((i) => (
        <li key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 animate-pulse rounded bg-wash" />
            <div className="h-3.5 w-64 max-w-full animate-pulse rounded bg-wash" />
          </div>
        </li>
      ))}
    </ul>
  );
}
