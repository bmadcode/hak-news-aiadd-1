import { Test, TestingModule } from '@nestjs/testing';
import { HackerNewsService } from './hacker-news.service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ArticleScraperService } from './services/article-scraper.service';
import { LLMService } from './services/llm.service';
import { of } from 'rxjs';
import { AxiosResponse, AxiosHeaders } from 'axios';
import { ArticleContentDto } from './dto/top-stories.dto';

describe('HackerNewsService', () => {
  let service: HackerNewsService;
  let httpService: HttpService;

  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      switch (key) {
        case 'LLM_API_KEY':
          return 'test-api-key';
        case 'LLM_API_ENDPOINT':
          return 'https://api.test.com/v1';
        default:
          return undefined;
      }
    }),
  };

  const mockAxiosResponse = <T>(data: T): AxiosResponse<T> => {
    const headers = new AxiosHeaders();
    return {
      data,
      status: 200,
      statusText: 'OK',
      headers,
      config: { headers },
    };
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
        ArticleScraperService,
        LLMService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<HackerNewsService>(HackerNewsService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTopStories', () => {
    it('should fetch the specified number of top stories', async () => {
      const mockStoryIds = [1, 2, 3];
      const mockStory = {
        id: 1,
        title: 'Test Story',
        url: 'https://test.com',
        score: 100,
        by: 'testuser',
        time: 1643673600,
        descendants: 50,
      };

      jest.spyOn(httpService, 'get').mockImplementation((url: string) => {
        if (url.includes('topstories')) {
          return of(mockAxiosResponse(mockStoryIds));
        }
        return of(mockAxiosResponse(mockStory));
      });

      const result = await service.getTopStories(2);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockStory);
    });

    it('should throw an error if numStories is out of range', async () => {
      await expect(service.getTopStories(31)).rejects.toThrow(
        'Number of stories must be between 1 and 30',
      );
    });
  });

  describe('getStoryComments', () => {
    const mockComment = {
      id: 1,
      text: 'Test Comment',
      by: 'commenter',
      time: 1643673600,
      parent: 123,
      kids: [2, 3],
    };

    it('should fetch the specified number of comments for a story', async () => {
      const mockStory = {
        id: 123,
        kids: [1, 2, 3],
      };

      jest.spyOn(httpService, 'get').mockImplementation((url: string) => {
        if (url.includes('/item/123.json')) {
          return of(mockAxiosResponse(mockStory));
        }
        return of(mockAxiosResponse(mockComment));
      });

      const result = await service.getStoryComments(123, 2);
      expect(result).toBeDefined();
      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('should throw an error if numComments is out of range', async () => {
      await expect(service.getStoryComments(123, 51)).rejects.toThrow(
        'Number of comments must be between 0 and 50',
      );
    });
  });

  describe('summarizeContent', () => {
    const mockSummary = {
      summary: 'Test summary',
      summaryGeneratedAt: new Date().toISOString(),
      tokenCount: 10,
    };

    it('should summarize text content directly', async () => {
      jest.spyOn(httpService, 'post').mockImplementation(() =>
        of(
          mockAxiosResponse({
            choices: [{ text: mockSummary.summary }],
            usage: { total_tokens: mockSummary.tokenCount },
          }),
        ),
      );

      const result = await service.summarizeContent('Test content', 100, false);
      expect(result.summary).toBe(mockSummary.summary);
      expect(result.tokenCount).toBe(mockSummary.tokenCount);
    });

    it('should fetch and summarize URL content', async () => {
      const mockArticle: ArticleContentDto = {
        text: 'Article content',
        fetchedAt: new Date().toISOString(),
        success: true,
      };

      jest
        .spyOn(service['articleScraperService'], 'scrapeArticle')
        .mockResolvedValue(mockArticle);

      jest.spyOn(service['llmService'], 'summarizeContent').mockResolvedValue({
        summary: mockSummary.summary,
        summaryGeneratedAt: mockSummary.summaryGeneratedAt,
        tokenCount: mockSummary.tokenCount,
      });

      const result = await service.summarizeContent(
        'https://test.com',
        100,
        false,
      );
      expect(result.summary).toBe(mockSummary.summary);
      expect(result.tokenCount).toBe(mockSummary.tokenCount);
    });

    it('should handle errors gracefully', async () => {
      jest
        .spyOn(service['llmService'], 'summarizeContent')
        .mockRejectedValue(new Error('LLM error'));

      await expect(
        service.summarizeContent('Test content', 100, false),
      ).rejects.toThrow('Failed to summarize content');
    });
  });
});
