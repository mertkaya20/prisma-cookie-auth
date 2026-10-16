import "dotenv/config";
import { z } from "zod";

const env = z
  .object({
    PORT: z.coerce.number().int().positive().default(4001),
    DATABASE_URL: z.string().min(1),
    NODE_ENV: z.enum(["development", "production", "test"]),
  })
  .parse(process.env);

export const config = {
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  nodeEnv: env.NODE_ENV,
};
