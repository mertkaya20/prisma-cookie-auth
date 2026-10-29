// TanStack Query önbellek anahtarları tek yerde: yazım hatası tsc'ye takılsın, sessizce kaçmasın.
export const queryKeys = {
  me: ["me"],
  projects: ["projects"],
  project: (id: string) => ["projects", id],
  projectTasks: (id: string) => ["projects", id, "tasks"],
  projectMembers: (id: string) => ["projects", id, "members"],
  task: (id: string) => ["tasks", id],
  tags: ["tags"],
} as const;
