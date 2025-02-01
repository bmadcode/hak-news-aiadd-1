import { Test, TestingModule } from '@nestjs/testing';
import { HackerNewsController } from './hacker-news.controller';
import { HackerNewsService } from './hacker-news.service';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import {
  StoryDto,
  ArticleContentDto,
  TopStoriesRequestDto,
} from './dto/top-stories.dto';
import { ArticleScraperService } from './services/article-scraper.service';
import { SummarizedStoriesRequestDto } from './dto/summarized-stories.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { LLMService } from './services/llm.service';

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
      ],
    }).compile();

    controller = module.get<HackerNewsController>(HackerNewsController);
    service = module.get<HackerNewsService>(HackerNewsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTopStories', () => {
    const mockRequest: TopStoriesRequestDto = {
      numStories: 5,
      numCommentsPerStory: 3,
      includeArticleContent: false,
    };

    const mockStory: StoryDto = {
      id: 1,
      title: 'Test Story',
      url: 'https://test.com',
      score: 100,
      by: 'testuser',
      time: 1643673600,
      descendants: 50,
      commentSummary: {
        summary: 'Test comment summary',
        summaryGeneratedAt: new Date().toISOString(),
        tokenCount: 50,
      },
    };

    const mockComment: HNComment & { level: number } = {
      id: 2,
      text: 'Test Comment',
      by: 'commenter',
      time: 1643673700,
      parent: 1,
      level: 0,
    };

    it('should return top stories with comment summaries', async () => {
      const getTopStoriesMock = jest.spyOn(service, 'getTopStories');
      const getStoryCommentsMock = jest.spyOn(service, 'getStoryComments');

      getTopStoriesMock.mockResolvedValue([mockStory]);
      getStoryCommentsMock.mockResolvedValue({
        summary: 'Test comment summary',
        summaryGeneratedAt: new Date().toISOString(),
        tokenCount: 50,
      });

      const result = await controller.getTopStories(mockRequest);

      expect(result).toBeDefined();
      expect(result.stories).toHaveLength(1);
      const story = result.stories[0];
      expect(story.commentSummary).toBeDefined();
      expect(story.commentSummary?.summary).toBe('Test comment summary');
      expect(result.meta).toBeDefined();
      expect(result.meta.storiesRetrieved).toBe(1);
      expect(getTopStoriesMock).toHaveBeenCalledWith(mockRequest.numStories);
    });

    it('should handle invalid request parameters', async () => {
      const invalidRequest: TopStoriesRequestDto = {
        numStories: 31, // Over limit
        numCommentsPerStory: 3,
        includeArticleContent: false,
      };

      await expect(controller.getTopStories(invalidRequest)).rejects.toThrow();
    });

    it('should handle service errors gracefully', async () => {
      const getTopStoriesSpy = jest
        .spyOn(service, 'getTopStories')
        .mockRejectedValue(new Error('Service error'));

      await expect(controller.getTopStories(mockRequest)).rejects.toThrow();
      expect(getTopStoriesSpy).toHaveBeenCalled();
    });

    it('should respect includeArticleContent flag', async () => {
      const requestWithContent: TopStoriesRequestDto = {
        ...mockRequest,
        includeArticleContent: true,
      };

      const mockArticleContent: ArticleContentDto = {
        text: 'Article content',
        fetchedAt: new Date().toISOString(),
        success: true,
      };

      const mockStoryWithContent: StoryDto = {
        ...mockStory,
        articleContent: mockArticleContent,
      };

      const getTopStoriesSpy = jest
        .spyOn(service, 'getTopStories')
        .mockResolvedValue([mockStoryWithContent]);
      const getStoryCommentsSpy = jest
        .spyOn(service, 'getStoryComments')
        .mockResolvedValue({
          summary: 'Test comment summary',
          summaryGeneratedAt: new Date().toISOString(),
          tokenCount: 50,
        });

      const result = await controller.getTopStories(requestWithContent);

      expect(result.stories[0].articleContent).toBeDefined();
      expect(result.stories[0].articleContent?.text).toBe('Article content');
      expect(getTopStoriesSpy).toHaveBeenCalled();
      expect(getStoryCommentsSpy).toHaveBeenCalled();
    });
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

      // Check article summary
      expect(firstStory.articleSummary).toEqual(mockSummaryResponse);

      // Check comments summary
      expect(firstStory.commentsSummary).toEqual(mockSummaryResponse);

      // Check metadata
      expect(result.meta).toHaveProperty('totalTokensUsed');
      expect(result.meta.totalTokensUsed).toBe(
        result.stories.reduce(
          (sum, story) =>
            sum +
            story.articleSummary.tokenCount +
            story.commentsSummary.tokenCount,
          0,
        ),
      );

      // Verify service calls
      expect(getTopStoriesMock).toHaveBeenCalledWith(validRequest.numStories);
      expect(getStoryCommentsMock).toHaveBeenCalledWith(
        mockStories[0].id,
        validRequest.numCommentsPerStory,
      );
      expect(summarizeContentMock).toHaveBeenCalledTimes(2); // 1 article + 1 comments summary per story
    });

    it('should handle article retrieval failure gracefully', async () => {
      // Setup mocks
      const getTopStoriesMock = jest.spyOn(service, 'getTopStories');
      const getStoryCommentsMock = jest.spyOn(service, 'getStoryComments');
      const summarizeContentMock = jest.spyOn(service, 'summarizeContent');

      getTopStoriesMock.mockResolvedValue([mockStories[0]]);
      getStoryCommentsMock.mockResolvedValue(mockSummaryResponse);

      // Mock article summarization to fail
      summarizeContentMock.mockImplementation((content) => {
        if (content === mockStories[0].url) {
          return Promise.reject(new Error('Failed to fetch article'));
        }
        return Promise.resolve(mockSummaryResponse);
      });

      // Execute
      const result = await controller.getSummarizedStories(validRequest);

      // Assert
      const story = result.stories[0];
      expect(story.articleSummary.summary).toBe(
        `${mockStories[0].title} from ${mockStories[0].url} unretrievable, try yourself by visiting the link.`,
      );
      expect(story.articleSummary.tokenCount).toBe(0);

      // Comments summary should still work
      expect(story.commentsSummary).toEqual(mockSummaryResponse);
    });

    it('should handle story without URL', async () => {
      // Setup mocks
      const storyWithoutUrl = { ...mockStories[0], url: undefined };
      const getTopStoriesMock = jest.spyOn(service, 'getTopStories');
      const getStoryCommentsMock = jest.spyOn(service, 'getStoryComments');
      const summarizeContentMock = jest.spyOn(service, 'summarizeContent');

      getTopStoriesMock.mockResolvedValue([storyWithoutUrl]);
      getStoryCommentsMock.mockResolvedValue(mockSummaryResponse);
      summarizeContentMock.mockResolvedValue(mockSummaryResponse);

      // Execute
      const result = await controller.getSummarizedStories(validRequest);

      // Assert
      const story = result.stories[0];
      expect(story.articleSummary.summary).toBe(
        `${storyWithoutUrl.title} (no URL provided)`,
      );
      expect(story.articleSummary.tokenCount).toBe(0);

      // Comments summary should still work
      expect(story.commentsSummary).toEqual(mockSummaryResponse);
    });

    it('should handle invalid request parameters', async () => {
      const invalidRequest: SummarizedStoriesRequestDto = {
        ...validRequest,
        numStories: 0, // Invalid value
      };

      await expect(
        controller.getSummarizedStories(invalidRequest),
      ).rejects.toThrow(HttpException);
    });

    it('should handle LLM service failures gracefully', async () => {
      // Setup mocks
      const getTopStoriesMock = jest.spyOn(service, 'getTopStories');
      const getStoryCommentsMock = jest.spyOn(service, 'getStoryComments');
      const summarizeContentMock = jest.spyOn(service, 'summarizeContent');

      getTopStoriesMock.mockResolvedValue([mockStories[0]]);
      getStoryCommentsMock.mockRejectedValue(new Error('LLM service error'));
      summarizeContentMock.mockRejectedValue(new Error('LLM service error'));

      // Execute and Assert
      await expect(
        controller.getSummarizedStories(validRequest),
      ).rejects.toThrow(
        new HttpException(
          'Failed to generate content summaries',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );

      expect(getTopStoriesMock).toHaveBeenCalled();
      expect(getStoryCommentsMock).toHaveBeenCalled();
    });
  });
});
