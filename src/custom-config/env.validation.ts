import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.string().transform(Number).default('3000'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage =
        'Missing or invalid environment variables:\n' +
        error.errors
          .map((err) => `- ${err.path.join('.')}: ${err.message}`)
          .join('\n');

      console.error('\x1b[31m%s\x1b[0m', errorMessage);
      process.exit(1);
    }
    throw error;
  }
}
