import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().default("postgres://user:pass@localhost:5432/veda"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  ENGINE_VERSION: z.string().default("v0.1"),
  ENABLE_VEDIC_SUNRISE: z.enum(["true", "false"]).default("false"),
  ENABLE_MUHURTHA_LITE: z.enum(["true", "false"]).default("true"),
  ENABLE_UPAYA: z.enum(["true", "false"]).default("true"),
});

export const env = schema.parse(process.env);
