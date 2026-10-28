// API cevaplarının şekli. API'deki userSelect / taskInclude ile aynı tutulmalı.
export type User = {
  id: string;
  email: string;
  name: string;
  role: "owner" | "member";
  organizationId: string;
};

export type TaskStatus = "todo" | "in_progress" | "done";

export type Project = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};
