import { Test, TestingModule } from '@nestjs/testing';
import { HackerNewsController } from './hacker-news.controller';
import { HackerNewsService } from './hacker-news.service';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import {
  TopStoriesRequestDto,
  TopStoriesResponseDto,
  StoryDto,
  ArticleContentDto,
} from './dto/top-stories.dto';
import { ArticleScraperService } from './services/article-scraper.service';

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule,
        CacheModule.register(),
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      controllers: [HackerNewsController],
      providers: [HackerNewsService, ArticleScraperService],
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
      comments: [],
    };

    const mockComment: HNComment & { level: number } = {
      id: 2,
      text: 'Test Comment',
      by: 'commenter',
      time: 1643673700,
      parent: 1,
      level: 0,
    };

    it('should return top stories with comments', async () => {
      const mockComments = [mockComment];

      const getTopStoriesSpy = jest
        .spyOn(service, 'getTopStories')
        .mockResolvedValue([{ ...mockStory }]);
      const getStoryCommentsSpy = jest
        .spyOn(service, 'getStoryComments')
        .mockResolvedValue(mockComments);

      const result = await controller.getTopStories(mockRequest);

      expect(result).toBeDefined();
      expect(result.stories).toHaveLength(1);
      expect(result.stories[0]).toEqual({
        ...mockStory,
        comments: mockComments,
      });
      expect(result.meta).toBeDefined();
      expect(result.meta.storiesRetrieved).toBe(1);
      expect(result.meta.totalCommentsRetrieved).toBe(1);
      expect(getTopStoriesSpy).toHaveBeenCalledWith(mockRequest.numStories);
      expect(getStoryCommentsSpy).toHaveBeenCalledWith(
        mockStory.id,
        mockRequest.numCommentsPerStory,
      );
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
        .mockResolvedValue([mockComment]);

      const result = await controller.getTopStories(requestWithContent);

      expect(result.stories[0].articleContent).toBeDefined();
      expect(result.stories[0].articleContent?.text).toBe('Article content');
      expect(getTopStoriesSpy).toHaveBeenCalled();
      expect(getStoryCommentsSpy).toHaveBeenCalled();
    });
  });
});
