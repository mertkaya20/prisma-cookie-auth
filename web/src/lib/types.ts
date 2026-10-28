// API cevaplarının şekli. API'deki userSelect / taskInclude / memberInclude ile aynı tutulmalı.
export type User = {
  id: string;
  email: string;
  name: string;
  role: "owner" | "member";
  organizationId: string;
};

export type TaskStatus = "todo" | "in_progress" | "done";
export type ProjectRole = "manager" | "contributor";

export type Project = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Member = {
  organizationId: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  user: User;
};

export type TagSummary = { id: string; name: string; color: string | null };

// taskInclude: görevin kendi alanları + oluşturan, atananlar, etiketler.
// Dikkat: atananlar ve etiketler ara tablonun satırları, asıl veri bir kat içeride (a.user, t.tag).
export type Task = {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy: User;
  assignees: { user: User }[];
  tags: { tag: TagSummary }[];
};
