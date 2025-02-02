import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { HackerNewsService } from './services/hacker-news.service';
import { HackerNewsController } from './controllers/hacker-news.controller';
import { ArticleScraperService } from './services/article-scraper.service';
import { LLMService } from './services/llm.service';
import { EmailService } from './services/email.service';
import { EmailTemplateService } from './services/email-template.service';
import { SubscriptionService } from './services/subscription.service';
import { SubscriptionModule } from './subscription.module';

@Module({
  imports: [
    HttpModule,
    CacheModule.register({
      ttl: 5 * 60 * 1000, // 5 minutes default TTL
      max: 100, // Maximum number of items in cache
    }),
    ConfigModule,
    SubscriptionModule,
  ],
  controllers: [HackerNewsController],
  providers: [
    HackerNewsService,
    ArticleScraperService,
    LLMService,
    EmailService,
    EmailTemplateService,
    SubscriptionService,
  ],
  exports: [HackerNewsService, EmailService, SubscriptionService],
})
export class HackerNewsModule {}
