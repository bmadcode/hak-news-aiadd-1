import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HackerNewsModule } from './hacker-news/hacker-news.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HackerNewsModule,
  ],
})
export class AppModule {}
