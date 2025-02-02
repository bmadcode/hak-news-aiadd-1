import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HackerNewsService } from '../hacker-news.service';
import {
  SummarizedStoriesRequestDto,
  SummarizedStoriesResponseDto,
} from '../dto/summarized-stories.dto';
import { EmailService } from '../services/email.service';
import { SubscriptionService } from '../services/subscription.service';

@ApiTags('hacker-news')
@Controller('hacker-news')
export class HackerNewsController {
  private readonly logger = new Logger(HackerNewsController.name);

  constructor(
    private readonly hackerNewsService: HackerNewsService,
    private readonly emailService: EmailService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Post('summarize')
  @ApiOperation({
    summary: 'Get summarized Hacker News stories',
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
    status: 200,
    description: 'Stories successfully summarized',
    type: SummarizedStoriesResponseDto,
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
      if (
        request.numCommentsPerStory < 0 ||
        request.numCommentsPerStory > 100
      ) {
        throw new HttpException(
          'Number of comments must be between 0 and 100',
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
          // Parallelize comment and article summarization
          const [commentsSummary, articleSummary] = await Promise.all([
            // Get comment summary
            this.hackerNewsService.getStoryComments(
              story.id,
              request.numCommentsPerStory,
            ),
            // Generate article summary if URL available
            story.url
              ? this.hackerNewsService.summarizeContent(
                  story.url,
                  request.maxSummaryLength,
                  request.includeOriginalContent,
                )
              : Promise.resolve({
                  summary: 'No URL available for this story.',
                  summaryGeneratedAt: new Date().toISOString(),
                  tokenCount: 0,
                }),
          ]);

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
          totalCommentsRetrieved: summarizedStories.reduce(
            (acc, story) => acc + (story.descendants || 0),
            0,
          ),
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

  @Post('newsletter')
  @ApiOperation({
    summary:
      'Send Hacker News newsletter to subscribers and optional additional emails',
  })
  @ApiResponse({ status: 200, description: 'Newsletter sent successfully' })
  async sendNewsletter(
    @Body() request: SummarizedStoriesRequestDto & { emails?: string[] },
  ) {
    try {
      const summaries = await this.getSummarizedStories(request);

      // Get subscribers from DynamoDB
      const subscribers =
        await this.subscriptionService.getSubscribers('hakdaily');

      // Merge subscribers with additional emails if provided
      const allRecipients = [
        ...new Set([...subscribers, ...(request.emails || [])]),
      ];

      if (allRecipients.length === 0) {
        throw new HttpException(
          'No recipients found. Please provide emails or ensure there are active subscribers.',
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.emailService.sendNewsletterEmail(allRecipients, summaries);
      return {
        message: 'Newsletter sent successfully',
        recipientCount: allRecipients.length,
        subscriberCount: subscribers.length,
        additionalEmailsCount: request.emails?.length || 0,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send newsletter: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to send newsletter',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
