import { Test, TestingModule } from '@nestjs/testing';
import { HackerNewsController } from './hacker-news.controller';
import { HackerNewsService } from './hacker-news.service';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { ArticleScraperService } from './services/article-scraper.service';
import { SummarizedStoriesRequestDto } from './dto/summarized-stories.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { LLMService } from './services/llm.service';
import { EmailService } from './services/email.service';
import { EmailTemplateService } from './services/email-template.service';

interface HNComment {
  id: number;
  text: string;
  by: string;
  time: number;
  parent: number;
  kids?: number[];
}

describe('HackerNewsController', () => {
  let controller: HackerNewsController;
  let service: HackerNewsService;

  const mockStories = [
    {
      id: 1,
      title: 'Test Story 1',
      url: 'http://test1.com',
      score: 100,
      by: 'user1',
      time: 1234567890,
      descendants: 5,
    },
    {
      id: 2,
      title: 'Test Story 2',
      url: 'http://test2.com',
      score: 200,
      by: 'user2',
      time: 1234567891,
      descendants: 10,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule,
        CacheModule.register(),
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              LLM_API_KEY: 'test-key',
              LLM_API_ENDPOINT: 'https://test.api/v1',
            }),
          ],
        }),
      ],
      controllers: [HackerNewsController],
      providers: [
        {
          provide: HackerNewsService,
          useValue: {
            getTopStories: jest.fn(() => Promise.resolve([])),
            getStoryComments: jest.fn(() => Promise.resolve([])),
            summarizeContent: jest.fn(() =>
              Promise.resolve({
                summary: 'Test summary',
                summaryGeneratedAt: new Date().toISOString(),
                tokenCount: 50,
              }),
            ),
          },
        },
        {
          provide: LLMService,
          useValue: {
            summarizeContent: jest.fn(() =>
              Promise.resolve({
                summary: 'Test summary',
                summaryGeneratedAt: new Date().toISOString(),
                tokenCount: 50,
              }),
            ),
          },
        },
        ArticleScraperService,
        EmailService,
        EmailTemplateService,
      ],
    }).compile();

    controller = module.get<HackerNewsController>(HackerNewsController);
    service = module.get<HackerNewsService>(HackerNewsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSummarizedStories', () => {
    const validRequest: SummarizedStoriesRequestDto = {
      numStories: 2,
      numCommentsPerStory: 2,
      maxSummaryLength: 200,
      includeOriginalContent: false,
    };

    const mockSummaryResponse = {
      summary: 'Test summary',
      summaryGeneratedAt: new Date().toISOString(),
      tokenCount: 50,
    };

    it('should return summarized stories with comments', async () => {
      // Setup mocks
      const getTopStoriesMock = jest.spyOn(service, 'getTopStories');
      const getStoryCommentsMock = jest.spyOn(service, 'getStoryComments');
      const summarizeContentMock = jest.spyOn(service, 'summarizeContent');

      getTopStoriesMock.mockResolvedValue(mockStories);
      getStoryCommentsMock.mockResolvedValue(mockSummaryResponse);
      summarizeContentMock.mockResolvedValue(mockSummaryResponse);

      // Execute
      const result = await controller.getSummarizedStories(validRequest);

      // Assert
      expect(result).toBeDefined();
      expect(result.stories).toHaveLength(2);

      const firstStory = result.stories[0];
      expect(firstStory).toHaveProperty('articleSummary');
      expect(firstStory).toHaveProperty('commentsSummary');
    });

    it('should handle invalid request parameters', async () => {
      const invalidRequest = {
        ...validRequest,
        numStories: 11, // Over limit
      };

      await expect(
        controller.getSummarizedStories(
          invalidRequest as SummarizedStoriesRequestDto,
        ),
      ).rejects.toThrow(HttpException);
    });

    it('should handle service errors gracefully', async () => {
      jest
        .spyOn(service, 'getTopStories')
        .mockRejectedValue(new Error('Service error'));

      await expect(
        controller.getSummarizedStories(validRequest),
      ).rejects.toThrow(HttpException);
    });
  });
});
