import { db } from "../../shared/db.js";
import { createSession, userSelect } from "../auth/auth.service.js";
import { seedDemo } from "./demo.seed.js";

// Her ziyaretçi kendi demo organizasyonunu alır; eskileri yenisi oluşturulurken temizlenir.
export const createDemo = async () => {
  await deleteExpiredDemos();

  const userId = await db.$transaction((tx) => seedDemo(tx));
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: userSelect,
  });
  const token = await createSession(userId);

  return { token, user };
};

const DEMO_LIFETIME_MS = 24 * 60 * 60 * 1000;

export const deleteExpiredDemos = async () => {
  const expired = await db.organization.findMany({
    where: {
      isDemo: true,
      createdAt: { lt: new Date(Date.now() - DEMO_LIFETIME_MS) },
    },
    select: { id: true },
  });
  if (expired.length === 0) return;

  const inExpired = { organizationId: { in: expired.map((org) => org.id) } };

  await db.$transaction([
    db.project.deleteMany({ where: inExpired }),
    db.tag.deleteMany({ where: inExpired }),
    db.user.deleteMany({ where: inExpired }),
    db.organization.deleteMany({
      where: { id: { in: expired.map((org) => org.id) } },
    }),
  ]);
};
