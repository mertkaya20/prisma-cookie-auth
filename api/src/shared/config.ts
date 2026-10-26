import "dotenv/config";
import { z } from "zod";

const env = z
  .object({
    PORT: z.coerce.number().int().positive().default(4001),
    DATABASE_URL: z.string().min(1),
    NODE_ENV: z.enum(["development", "production", "test"]),
    TRUST_PROXY: z.coerce.number().int().min(0).default(0),
    CORS_ORIGIN: z.url(),
  })
  .parse(process.env);

export const config = {
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  nodeEnv: env.NODE_ENV,
  trustProxy: env.TRUST_PROXY,
  corsOrigin: env.CORS_ORIGIN,
};
