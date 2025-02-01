import { z } from 'zod';

/**
 * Environment configuration schema
 */
export const envSchema = z.object({
  STAGE: z.enum(['dev', 'prod']),
  NODE_ENV: z.enum(['development', 'production']),
  API_KEY_NAME: z.string(),
  RATE_LIMIT: z.number().default(10),
  BURST_LIMIT: z.number().default(20),
  LAMBDA_MEMORY: z.number().default(1024),
  LAMBDA_TIMEOUT: z.number().default(30),
  // HN API Settings
  HN_API_BASE_URL: z.string().default('https://hacker-news.firebaseio.com/v0'),
  HN_API_RATE_LIMIT: z.number().default(500),
  // LLM Settings
  LLM_API_KEY: z.string(),
  LLM_API_URL: z.string(),
  LLM_MODEL: z.string(),
  // Email Settings
  SMTP_HOST: z.string(),
  SMTP_PORT: z.number(),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Default configuration for development
 */
export const devConfig: EnvConfig = {
  STAGE: 'dev',
  NODE_ENV: 'development',
  API_KEY_NAME: 'HakNewsDevApiKey',
  RATE_LIMIT: 10,
  BURST_LIMIT: 20,
  LAMBDA_MEMORY: 1024,
  LAMBDA_TIMEOUT: 30,
  HN_API_BASE_URL: 'https://hacker-news.firebaseio.com/v0',
  HN_API_RATE_LIMIT: 500,
  LLM_API_KEY: process.env.LLM_API_KEY || '',
  LLM_API_URL: process.env.LLM_API_URL || '',
  LLM_MODEL: process.env.LLM_MODEL || '',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
};

/**
 * Production configuration
 * Values will be loaded from environment variables or SSM Parameter Store
 */
export const prodConfig: Partial<EnvConfig> = {
  STAGE: 'prod',
  NODE_ENV: 'production',
  API_KEY_NAME: 'HakNewsProdApiKey',
  RATE_LIMIT: 100,
  BURST_LIMIT: 200,
  LAMBDA_MEMORY: 2048,
  LAMBDA_TIMEOUT: 60,
};

/**
 * Get configuration based on stage
 */
export const getConfig = (stage: 'dev' | 'prod'): EnvConfig => {
  if (stage === 'prod') {
    return envSchema.parse({
      ...devConfig,
      ...prodConfig,
    });
  }
  return devConfig;
};
