import { randomBytes } from "node:crypto";
import type { Prisma } from "../../generated/prisma/client.js";
import type {
  ProjectRole,
  Role,
  TaskStatus,
} from "../../generated/prisma/enums.js";
import { hashPassword } from "../auth/auth.service.js";

type PersonKey = "alex" | "maya" | "deniz" | "sam" | "priya" | "jordan";
type TagKey = "design" | "bug" | "backend" | "content" | "urgent";

type TaskSeed = {
  title: string;
  description?: string;
  status: TaskStatus;
  dueInDays?: number;
  createdBy: PersonKey;
  assignees: PersonKey[];
  tags: TagKey[];
  comments: { author: PersonKey; body: string; hoursAgo: number }[];
};

type ProjectSeed = {
  name: string;
  description: string;
  members: { person: PersonKey; role: ProjectRole }[];
  tasks: TaskSeed[];
};

// Ziyaretçi Alex olarak girer (owner).
const PEOPLE: Record<
  PersonKey,
  { name: string; role: Role; deactivated?: boolean }
> = {
  alex: { name: "Alex Morgan", role: "owner" },
  maya: { name: "Maya Chen", role: "member" },
  deniz: { name: "Deniz Aydın", role: "member" },
  sam: { name: "Sam Rivera", role: "member" },
  priya: { name: "Priya Nair", role: "member" },
  jordan: { name: "Jordan Lee", role: "member", deactivated: true },
};

// Renkler web'deki ColorPicker paletinden.
const TAGS: Record<TagKey, { name: string; color: string }> = {
  design: { name: "Design", color: "#7C3AED" },
  bug: { name: "Bug", color: "#DC2626" },
  backend: { name: "Backend", color: "#2563EB" },
  content: { name: "Content", color: "#0D9488" },
  urgent: { name: "Urgent", color: "#EA580C" },
};

const PROJECTS: ProjectSeed[] = [
  {
    name: "Website relaunch",
    description: "New marketing site, live before the spring launch.",
    members: [
      { person: "maya", role: "manager" },
      { person: "alex", role: "contributor" },
      { person: "deniz", role: "contributor" },
      { person: "sam", role: "contributor" },
    ],
    tasks: [
      {
        title: "Write homepage copy",
        status: "done",
        createdBy: "maya",
        assignees: ["alex"],
        tags: ["content"],
        comments: [
          {
            author: "maya",
            body: "Reads really well. Shipping it.",
            hoursAgo: 70,
          },
        ],
      },
      {
        title: "Build pricing page",
        description: "Three plans side by side, monthly and yearly toggle.",
        status: "in_progress",
        dueInDays: 3,
        createdBy: "maya",
        assignees: ["deniz", "alex"],
        tags: ["design"],
        comments: [
          {
            author: "deniz",
            body: "Layout is in. Waiting on the final prices from sales.",
            hoursAgo: 30,
          },
          {
            author: "alex",
            body: "Prices are in the shared doc now.",
            hoursAgo: 5,
          },
        ],
      },
      {
        title: "Fix mobile nav overlapping the logo",
        description: "Happens below 380px wide.",
        status: "todo",
        dueInDays: -1,
        createdBy: "sam",
        assignees: ["sam"],
        tags: ["bug", "urgent"],
        comments: [
          {
            author: "sam",
            body: "Reproduced on an iPhone SE. Looking into it today.",
            hoursAgo: 8,
          },
        ],
      },
      {
        title: "Set up the contact form endpoint",
        status: "todo",
        dueInDays: 7,
        createdBy: "maya",
        assignees: ["deniz"],
        tags: ["backend"],
        comments: [],
      },
      {
        title: "Optimize hero images",
        status: "in_progress",
        dueInDays: 5,
        createdBy: "deniz",
        assignees: ["sam"],
        tags: [],
        comments: [],
      },
      {
        title: "Collect customer quotes",
        status: "todo",
        createdBy: "alex",
        assignees: [],
        tags: ["content"],
        comments: [],
      },
    ],
  },
  {
    name: "Mobile app beta",
    description: "Invite-only beta for iOS and Android.",
    members: [
      { person: "deniz", role: "manager" },
      { person: "priya", role: "contributor" },
      { person: "jordan", role: "contributor" },
    ],
    tasks: [
      {
        title: "Send the beta tester survey",
        status: "done",
        createdBy: "deniz",
        assignees: ["priya"],
        tags: ["content"],
        comments: [],
      },
      {
        title: "Crash on login with an expired session",
        description: "Token refresh races with the first request after launch.",
        status: "in_progress",
        dueInDays: 1,
        createdBy: "priya",
        assignees: ["priya"],
        tags: ["bug", "urgent", "backend"],
        comments: [
          {
            author: "priya",
            body: "Found it: two refreshes at once. Fix is in review.",
            hoursAgo: 20,
          },
          {
            author: "deniz",
            body: "Nice catch. Let's get it into the next build.",
            hoursAgo: 18,
          },
        ],
      },
      {
        title: "Design the onboarding screens",
        status: "todo",
        dueInDays: 10,
        createdBy: "deniz",
        assignees: ["jordan"],
        tags: ["design"],
        comments: [
          {
            author: "deniz",
            body: "Jordan has left the team, this needs a new owner.",
            hoursAgo: 3,
          },
        ],
      },
      {
        title: "Push notification settings",
        status: "todo",
        dueInDays: 14,
        createdBy: "deniz",
        assignees: [],
        tags: ["backend"],
        comments: [],
      },
    ],
  },
];

const HOUR = 60 * 60 * 1000;

const hoursAgo = (hours: number) => new Date(Date.now() - hours * HOUR);

// Son tarihler gün olarak saklanır (UTC gece yarısı), API'deki dueDate gibi.
const daysFromNow = (days: number) => {
  const date = new Date(Date.now() + days * 24 * HOUR);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

// Kimse bu şifreyi bilmez; demo kullanıcılarına sadece demo oturumuyla girilir.
// bcrypt yavaş olduğu için process başına bir kez hesaplanır.
let passwordHash: Promise<string> | undefined;
const getPasswordHash = () =>
  (passwordHash ??= hashPassword(randomBytes(24).toString("base64url")));

/**
 * Yeni bir demo organizasyonu kurup içini doldurur, ziyaretçinin (Alex) id'sini döner.
 * Transaction içinde çağrılır: yarıda kalırsa yarım bir demo kalmaz.
 */
export const seedDemo = async (tx: Prisma.TransactionClient) => {
  const organization = await tx.organization.create({
    data: { name: "Lumen Studio", isDemo: true },
  });
  const organizationId = organization.id;

  // E-posta bütün sistemde benzersiz; her demo kendi ekini alır.
  const suffix = randomBytes(4).toString("hex");
  const emailOf = (key: PersonKey) => `${key}.${suffix}@example.com`;

  const hash = await getPasswordHash();
  const users = await tx.user.createManyAndReturn({
    data: (Object.keys(PEOPLE) as PersonKey[]).map((key) => ({
      organizationId,
      email: emailOf(key),
      name: PEOPLE[key].name,
      role: PEOPLE[key].role,
      passwordHash: hash,
      deactivatedAt: PEOPLE[key].deactivated ? hoursAgo(72) : null,
    })),
    select: { id: true, email: true },
  });
  const userIds = new Map(users.map((user) => [user.email, user.id]));
  const userId = (key: PersonKey) => userIds.get(emailOf(key))!;

  const tags = await tx.tag.createManyAndReturn({
    data: Object.values(TAGS).map((tag) => ({ organizationId, ...tag })),
    select: { id: true, name: true },
  });
  const tagIds = new Map(tags.map((tag) => [tag.name, tag.id]));
  const tagId = (key: TagKey) => tagIds.get(TAGS[key].name)!;

  // Görevlerin bağlı satırları toplanır, en sonda tek seferde yazılır.
  const assignees: Prisma.TaskAssigneeCreateManyInput[] = [];
  const taskTags: Prisma.TaskTagCreateManyInput[] = [];
  const comments: Prisma.CommentCreateManyInput[] = [];

  for (const project of PROJECTS) {
    const { id: projectId } = await tx.project.create({
      data: {
        organizationId,
        name: project.name,
        description: project.description,
      },
      select: { id: true },
    });

    await tx.projectMember.createMany({
      data: project.members.map((member) => ({
        organizationId,
        projectId,
        userId: userId(member.person),
        role: member.role,
      })),
    });

    const tasks = await tx.task.createManyAndReturn({
      data: project.tasks.map((task, index) => ({
        organizationId,
        projectId,
        title: task.title,
        description: task.description ?? null,
        status: task.status,
        dueDate:
          task.dueInDays === undefined ? null : daysFromNow(task.dueInDays),
        createdById: userId(task.createdBy),
        // Hepsi aynı anda oluşsa sıralama rastgele olurdu; listede ilk yazılan en altta.
        createdAt: hoursAgo((project.tasks.length - index) * 20),
      })),
      select: { id: true, title: true },
    });
    const taskIds = new Map(tasks.map((task) => [task.title, task.id]));

    for (const task of project.tasks) {
      const taskId = taskIds.get(task.title)!;

      for (const key of task.assignees) {
        assignees.push({ organizationId, taskId, userId: userId(key) });
      }
      for (const key of task.tags) {
        taskTags.push({ organizationId, taskId, tagId: tagId(key) });
      }
      for (const comment of task.comments) {
        // updatedAt = createdAt: yoksa web yorumu "(edited)" gösterirdi.
        const at = hoursAgo(comment.hoursAgo);
        comments.push({
          organizationId,
          taskId,
          authorId: userId(comment.author),
          body: comment.body,
          createdAt: at,
          updatedAt: at,
        });
      }
    }
  }

  await tx.taskAssignee.createMany({ data: assignees });
  await tx.taskTag.createMany({ data: taskTags });
  await tx.comment.createMany({ data: comments });

  return userId("alex");
};
