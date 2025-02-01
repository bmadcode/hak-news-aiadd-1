import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HackerNewsService } from './hacker-news.service';
import {
  SummarizedStoriesRequestDto,
  SummarizedStoriesResponseDto,
} from './dto/summarized-stories.dto';

@ApiTags('hacker-news')
@Controller('api/v1/hacker-news')
export class HackerNewsController {
  private readonly logger = new Logger(HackerNewsController.name);

  constructor(private readonly hackerNewsService: HackerNewsService) {}

  @Post('summarized-stories')
  @ApiOperation({
    summary: 'Get AI-summarized top Hacker News stories with comments',
    description: `
Retrieves and summarizes top Hacker News stories and their comments using AI.
- Fetches the most recent top stories from Hacker News
- Generates concise summaries of articles and comments using LLM
- Supports configurable number of stories and comments
- Includes metadata about processing time and token usage
- Optional inclusion of original content alongside summaries
- Rate limited to prevent abuse
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Successfully retrieved and summarized stories and comments',
    type: SummarizedStoriesResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid request parameters. Ensure:\n- numStories is between 1 and 10\n- numCommentsPerStory is between 0 and 20\n- maxSummaryLength is between 50 and 500 words',
  })
  @ApiResponse({
    status: 429,
    description:
      'Rate limit exceeded. Please wait before making another request.',
  })
  @ApiResponse({
    status: 500,
    description:
      'Internal server error. This could be due to:\n- LLM service unavailable\n- Hacker News API issues\n- Network connectivity problems',
  })
  @ApiResponse({
    status: 504,
    description: 'Gateway timeout. Request took too long to process.',
  })
  async getSummarizedStories(
    @Body() request: SummarizedStoriesRequestDto,
  ): Promise<SummarizedStoriesResponseDto> {
    const startTime = Date.now();

    try {
      // Validate request parameters
      if (request.numStories < 1 || request.numStories > 10) {
        throw new HttpException(
          'Number of stories must be between 1 and 10',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (request.numCommentsPerStory < 0 || request.numCommentsPerStory > 20) {
        throw new HttpException(
          'Number of comments must be between 0 and 20',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (request.maxSummaryLength < 50 || request.maxSummaryLength > 500) {
        throw new HttpException(
          'Summary length must be between 50 and 500 words',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Fetch top stories
      const stories = await this.hackerNewsService.getTopStories(
        request.numStories,
      );

      // Process each story with summaries
      const summarizedStories = await Promise.all(
        stories.map(async (story) => {
          // Get comment summary
          const commentsSummary = await this.hackerNewsService.getStoryComments(
            story.id,
            request.numCommentsPerStory,
          );

          // Generate article summary using URL if available, otherwise use title
          const articleSummary = story.url
            ? await this.hackerNewsService
                .summarizeContent(
                  story.url,
                  request.maxSummaryLength,
                  request.includeOriginalContent,
                )
                .catch(() => ({
                  summary: `${story.title} from ${story.url} unretrievable, try yourself by visiting the link.`,
                  summaryGeneratedAt: new Date().toISOString(),
                  tokenCount: 0,
                  ...(request.includeOriginalContent && {
                    originalContent: '',
                  }),
                }))
            : {
                summary: `${story.title} (no URL provided)`,
                summaryGeneratedAt: new Date().toISOString(),
                tokenCount: 0,
                ...(request.includeOriginalContent && { originalContent: '' }),
              };

          return {
            ...story,
            articleSummary,
            commentsSummary,
          };
        }),
      );

      // Calculate total tokens used
      const totalTokens = summarizedStories.reduce(
        (sum, story) =>
          sum +
          story.articleSummary.tokenCount +
          story.commentsSummary.tokenCount,
        0,
      );

      return {
        stories: summarizedStories,
        meta: {
          fetchedAt: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
          storiesRetrieved: summarizedStories.length,
          totalCommentsRetrieved: summarizedStories.length, // Each story has one comment summary
          totalTokensUsed: totalTokens,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate summarized stories: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to generate content summaries',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
