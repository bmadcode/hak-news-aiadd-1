import { z } from 'zod';
import * as dotenv from 'dotenv';

// Load environment-specific .env file
const envFile =
  process.env.TEST_ENV === 'prod' ? '.env.production' : '.env.local';
dotenv.config({ path: envFile });

const testConfigSchema = z.object({
  API_URL: z.string().default('http://localhost:3000'),
  API_KEY: z.string().default('test-api-key'),
  DYNAMODB_ENDPOINT: z.string().default('http://localhost:8000'),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().default('test'),
  AWS_SECRET_ACCESS_KEY: z.string().default('test'),
  TEST_ENV: z.enum(['local', 'prod']).default('local'),
});

export type TestConfig = z.infer<typeof testConfigSchema>;

export const getTestConfig = (): TestConfig => {
  const config = testConfigSchema.parse(process.env);
  return config;
};

export const config = getTestConfig();
