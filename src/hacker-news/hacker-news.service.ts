import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ArticleScraperService } from './services/article-scraper.service';
import { LLMService, SummarizedContent } from './services/llm.service';

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
    private readonly llmService: LLMService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getTopStories(
    numStories: number,
    includeArticleContent = false,
  ): Promise<HNStory[]> {
    if (numStories < 1 || numStories > 30) {
      throw new Error('Number of stories must be between 1 and 30');
    }

    this.logger.debug(
      `Fetching ${numStories} top stories (includeArticleContent: ${includeArticleContent})`,
    );

    const cacheKey = `top-stories-${numStories}-${includeArticleContent}`;
    const cachedStories = await this.cacheManager.get<HNStory[]>(cacheKey);
    if (cachedStories) {
      this.logger.debug('Returning cached stories');
      return cachedStories;
    }

    try {
      this.logger.debug('Fetching top story IDs from Hacker News API');
      const response = await firstValueFrom(
        this.httpService.get<number[]>(`${this.baseUrl}/topstories.json`),
      );
      const storyIds = response.data.slice(0, numStories);
      this.logger.debug(`Retrieved ${storyIds.length} story IDs`);

      const stories = await Promise.all(
        storyIds.map(async (id) => {
          this.logger.debug(`Fetching details for story ${id}`);
          const storyResponse = await firstValueFrom(
            this.httpService.get<HNStory>(`${this.baseUrl}/item/${id}.json`),
          );
          const story = storyResponse.data;
          this.logger.debug(
            `Retrieved story: ${story.title} (${story.url || 'no URL'})`,
          );

          if (includeArticleContent && story.url) {
            this.logger.debug(`Fetching article content for story ${id}`);
            const articleContent =
              await this.articleScraperService.scrapeArticle(story.url);
            this.logger.debug(
              `Retrieved ${articleContent.text.length} characters of content`,
            );
            return { ...story, articleContent };
          }

          return story;
        }),
      );

      this.logger.debug(`Successfully fetched ${stories.length} stories`);
      await this.cacheManager.set(cacheKey, stories, 5 * 60 * 1000);
      return stories;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to fetch top stories: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error('Failed to fetch top stories');
    }
  }

  async getStoryComments(
    storyId: number,
    numComments: number,
  ): Promise<SummarizedContent> {
    if (numComments < 0 || numComments > 50) {
      throw new Error('Number of comments must be between 0 and 50');
    }

    this.logger.debug(`Fetching ${numComments} comments for story ${storyId}`);

    const cacheKey = `story-comments-${storyId}-${numComments}`;
    const cachedSummary =
      await this.cacheManager.get<SummarizedContent>(cacheKey);
    if (cachedSummary) {
      this.logger.debug('Returning cached comment summary');
      return cachedSummary;
    }

    try {
      this.logger.debug(`Fetching story ${storyId} details`);
      const storyResponse = await firstValueFrom(
        this.httpService.get<HNStory>(`${this.baseUrl}/item/${storyId}.json`),
      );
      const story = storyResponse.data;

      if (!story.kids || story.kids.length === 0) {
        this.logger.debug(`No comments found for story ${storyId}`);
        return {
          summary: 'No comments available for this story.',
          summaryGeneratedAt: new Date().toISOString(),
          tokenCount: 0,
        };
      }

      this.logger.debug(`Story has ${story.kids.length} top-level comments`);

      const comments: Array<HNComment & { level: number }> = [];
      const fetchComment = async (
        commentId: number,
        level: number,
      ): Promise<void> => {
        if (comments.length >= numComments) {
          return;
        }

        try {
          this.logger.debug(`Fetching comment ${commentId} at level ${level}`);
          const commentResponse = await firstValueFrom(
            this.httpService.get<HNComment>(
              `${this.baseUrl}/item/${commentId}.json`,
            ),
          );
          const comment = commentResponse.data;

          if (comment && comment.text) {
            this.logger.debug(
              `Retrieved comment ${commentId} with ${comment.text.length} characters`,
            );
            comments.push({ ...comment, level });
          }

          if (comment && comment.kids && comments.length < numComments) {
            this.logger.debug(
              `Comment ${commentId} has ${comment.kids.length} replies`,
            );
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
            error instanceof Error ? error.stack : undefined,
          );
        }
      };

      for (const commentId of story.kids) {
        if (comments.length >= numComments) break;
        await fetchComment(commentId, 0);
      }

      this.logger.debug(
        `Successfully fetched ${comments.length} comments for story ${storyId}`,
      );

      // Generate summary from comments
      const commentText = comments
        .map((comment) => `Comment by ${comment.by}: ${comment.text}`)
        .join('\n\n');

      const summary = await this.llmService.summarizeContent(
        commentText,
        500, // reasonable length for comment summary
        false,
      );

      await this.cacheManager.set(cacheKey, summary, 15 * 60 * 1000);
      return summary;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to fetch comments for story ${storyId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error(`Failed to fetch comments for story ${storyId}`);
    }
  }

  async summarizeContent(
    contentOrUrl: string,
    maxLength: number,
    includeOriginal = false,
  ): Promise<SummarizedContent> {
    try {
      this.logger.debug(
        `Attempting to summarize content${contentOrUrl.startsWith('http') ? ' from URL' : ''}: ${
          contentOrUrl.length > 100
            ? contentOrUrl.substring(0, 100) + '...'
            : contentOrUrl
        }`,
      );

      // If it's a URL, fetch the content first
      let content = contentOrUrl;
      if (contentOrUrl.startsWith('http')) {
        this.logger.debug(`Fetching content from URL: ${contentOrUrl}`);
        const articleContent =
          await this.articleScraperService.scrapeArticle(contentOrUrl);

        if (!articleContent.success) {
          throw new Error(articleContent.error || 'Failed to fetch article');
        }

        content = articleContent.text;
        this.logger.debug(
          `Fetched content length: ${content.length} characters`,
        );
        this.logger.debug(`Content preview: ${content.substring(0, 100)}...`);
      }

      this.logger.debug(
        `Sending content to LLM service for summarization (length: ${content.length})`,
      );
      const summary = await this.llmService.summarizeContent(
        content,
        maxLength,
        includeOriginal,
      );
      this.logger.debug(
        `Successfully generated summary (length: ${summary.summary.length})`,
      );
      this.logger.debug(
        `Summary preview: ${summary.summary.substring(0, 100)}...`,
      );

      return summary;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to summarize content: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error instanceof Error ? error : new Error(errorMessage);
    }
  }
}
