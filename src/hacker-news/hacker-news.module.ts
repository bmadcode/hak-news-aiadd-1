import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { HackerNewsService } from './hacker-news.service';
import { HackerNewsController } from './hacker-news.controller';
import { ArticleScraperService } from './services/article-scraper.service';
import { LLMService } from './services/llm.service';
import { EmailService } from './services/email.service';
import { EmailTemplateService } from './services/email-template.service';

@Module({
  imports: [
    HttpModule,
    CacheModule.register({
      ttl: 5 * 60 * 1000, // 5 minutes default TTL
      max: 100, // Maximum number of items in cache
    }),
    ConfigModule,
  ],
  controllers: [HackerNewsController],
  providers: [
    HackerNewsService,
    ArticleScraperService,
    LLMService,
    EmailService,
    EmailTemplateService,
  ],
  exports: [HackerNewsService, EmailService],
})
export class HackerNewsModule {}
