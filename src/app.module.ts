import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HackerNewsModule } from './hacker-news/hacker-news.module';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.production', '.env.local'],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production')
          .default('development'),
        LLM_API_KEY: Joi.string().required(),
        LLM_API_ENDPOINT: Joi.string().required(),
        LLM_MODEL: Joi.string().required(),
        PORT: Joi.number().default(3000),
      }),
    }),
    HackerNewsModule,
  ],
})
export class AppModule {}
