import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HackerNewsModule } from './hacker-news/hacker-news.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.production', '.env.local'],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        HN_API_BASE_URL: Joi.string().required(),
        HN_API_RATE_LIMIT: Joi.number().required(),
        LLM_API_KEY: Joi.string().required(),
        LLM_API_ENDPOINT: Joi.string().required(),
        LLM_MODEL: Joi.string().required(),
        SMTP_HOST: Joi.string().required(),
        SMTP_PORT: Joi.number().required(),
        SMTP_USER: Joi.string().required(),
        SMTP_PASS: Joi.string().required(),
        SUBSCRIPTIONS_TABLE_NAME: Joi.string().default(
          'hak-news-subscriptions',
        ),
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    CacheModule.register({
      isGlobal: true,
    }),
    HackerNewsModule,
  ],
})
export class AppModule {}
