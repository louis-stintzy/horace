import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().max(65_535).default(3000),
  DATABASE_URL: z.string().min(1),
  APP_TIME_ZONE: z.literal("Europe/Paris").default("Europe/Paris"),
  APP_CURRENCY: z.literal("EUR").default("EUR"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment configuration", parsedEnv.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

export const env = parsedEnv.data;
