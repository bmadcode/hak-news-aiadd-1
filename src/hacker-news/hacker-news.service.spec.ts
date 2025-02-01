import { Test, TestingModule } from '@nestjs/testing';
import { HackerNewsService } from './hacker-news.service';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { ArticleScraperService } from './services/article-scraper.service';

describe('HackerNewsService', () => {
  let service: HackerNewsService;

  const mockArticleScraperService = {
    scrapeArticle: jest.fn().mockImplementation((_url) => {
      return Promise.resolve({
        success: true,
        content: 'Mocked article content',
        error: null,
      });
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule,
        CacheModule.register(),
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      providers: [
        HackerNewsService,
        {
          provide: ArticleScraperService,
          useValue: mockArticleScraperService,
        },
      ],
    }).compile();

    service = module.get<HackerNewsService>(HackerNewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTopStories', () => {
    it('should fetch the specified number of top stories', async () => {
      const numStories = 5;
      const result = await service.getTopStories(numStories);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(numStories);
      // Each story should have the required properties
      result.forEach((story) => {
        expect(story).toHaveProperty('id');
        expect(story).toHaveProperty('title');
        expect(story).toHaveProperty('url');
        expect(story).toHaveProperty('score');
        expect(story).toHaveProperty('by');
        expect(story).toHaveProperty('time');
      });
    });

    it('should throw an error if numStories is out of range', async () => {
      await expect(service.getTopStories(31)).rejects.toThrow(
        'Number of stories must be between 1 and 30',
      );
      await expect(service.getTopStories(0)).rejects.toThrow(
        'Number of stories must be between 1 and 30',
      );
      await expect(service.getTopStories(-1)).rejects.toThrow(
        'Number of stories must be between 1 and 30',
      );
    });
  });

  describe('getStoryComments', () => {
    it('should fetch the specified number of comments for a story', async () => {
      // First get a story ID
      const stories = await service.getTopStories(1);
      const storyId = stories[0].id;
      const numComments = 5;

      const comments = await service.getStoryComments(storyId, numComments);

      expect(comments).toBeDefined();
      expect(Array.isArray(comments)).toBe(true);
      expect(comments.length).toBeLessThanOrEqual(numComments);
      // Each comment should have the required properties
      comments.forEach((comment) => {
        expect(comment).toHaveProperty('id');
        expect(comment).toHaveProperty('text');
        expect(comment).toHaveProperty('by');
        expect(comment).toHaveProperty('time');
        expect(comment).toHaveProperty('level');
      });
    });

    it('should throw an error if numComments is out of range', async () => {
      const storyId = 1;
      await expect(service.getStoryComments(storyId, 51)).rejects.toThrow(
        'Number of comments must be between 0 and 50',
      );
      await expect(service.getStoryComments(storyId, -1)).rejects.toThrow(
        'Number of comments must be between 0 and 50',
      );
    });
  });
});
