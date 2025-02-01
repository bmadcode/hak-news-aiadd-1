import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ArticleScraperService } from './services/article-scraper.service';

interface HNStory {
  id: number;
  title: string;
  url?: string;
  score: number;
  by: string;
  time: number;
  descendants: number;
  kids?: number[];
}

interface HNComment {
  id: number;
  text: string;
  by: string;
  time: number;
  parent: number;
  kids?: number[];
}

@Injectable()
export class HackerNewsService {
  private readonly logger = new Logger(HackerNewsService.name);
  private readonly baseUrl = 'https://hacker-news.firebaseio.com/v0';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly articleScraperService: ArticleScraperService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getTopStories(
    numStories: number,
    includeArticleContent = false,
  ): Promise<HNStory[]> {
    if (numStories < 1 || numStories > 30) {
      throw new Error('Number of stories must be between 1 and 30');
    }

    // Try to get from cache first
    const cacheKey = `top-stories-${numStories}-${includeArticleContent}`;
    const cachedStories = await this.cacheManager.get<HNStory[]>(cacheKey);
    if (cachedStories) {
      return cachedStories;
    }

    try {
      // Fetch top story IDs
      const response = await firstValueFrom(
        this.httpService.get<number[]>(`${this.baseUrl}/topstories.json`),
      );
      const storyIds = response.data.slice(0, numStories);

      // Fetch story details in parallel
      const stories = await Promise.all(
        storyIds.map(async (id) => {
          const storyResponse = await firstValueFrom(
            this.httpService.get<HNStory>(`${this.baseUrl}/item/${id}.json`),
          );
          const story = storyResponse.data;

          // If requested and URL exists, fetch article content
          if (includeArticleContent && story.url) {
            const articleContent =
              await this.articleScraperService.scrapeArticle(story.url);
            return { ...story, articleContent };
          }

          return story;
        }),
      );

      // Cache the results
      await this.cacheManager.set(cacheKey, stories, 5 * 60 * 1000); // 5 minutes TTL

      return stories;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch top stories: ${errorMessage}`);
      throw new Error('Failed to fetch top stories');
    }
  }

  async getStoryComments(
    storyId: number,
    numComments: number,
  ): Promise<Array<HNComment & { level: number }>> {
    if (numComments < 0 || numComments > 50) {
      throw new Error('Number of comments must be between 0 and 50');
    }

    const cacheKey = `story-comments-${storyId}-${numComments}`;
    const cachedComments =
      await this.cacheManager.get<Array<HNComment & { level: number }>>(
        cacheKey,
      );
    if (cachedComments) {
      return cachedComments;
    }

    try {
      // Fetch the story first to get comment IDs
      const storyResponse = await firstValueFrom(
        this.httpService.get<HNStory>(`${this.baseUrl}/item/${storyId}.json`),
      );
      const story = storyResponse.data;

      if (!story.kids || story.kids.length === 0) {
        return [];
      }

      const comments: Array<HNComment & { level: number }> = [];
      const fetchComment = async (
        commentId: number,
        level: number,
      ): Promise<void> => {
        if (comments.length >= numComments) {
          return;
        }

        try {
          const commentResponse = await firstValueFrom(
            this.httpService.get<HNComment>(
              `${this.baseUrl}/item/${commentId}.json`,
            ),
          );
          const comment = commentResponse.data;

          if (comment && comment.text) {
            comments.push({ ...comment, level });
          }

          // Recursively fetch child comments if needed
          if (comment && comment.kids && comments.length < numComments) {
            for (const kidId of comment.kids) {
              if (comments.length >= numComments) break;
              await fetchComment(kidId, level + 1);
            }
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          this.logger.warn(
            `Failed to fetch comment ${commentId}: ${errorMessage}`,
          );
        }
      };

      // Start fetching top-level comments
      for (const commentId of story.kids) {
        if (comments.length >= numComments) break;
        await fetchComment(commentId, 0);
      }

      // Cache the results
      await this.cacheManager.set(cacheKey, comments, 15 * 60 * 1000); // 15 minutes TTL

      return comments;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to fetch comments for story ${storyId}: ${errorMessage}`,
      );
      throw new Error(`Failed to fetch comments for story ${storyId}`);
    }
  }
}
