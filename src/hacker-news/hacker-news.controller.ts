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
  TopStoriesRequestDto,
  TopStoriesResponseDto,
} from './dto/top-stories.dto';

@ApiTags('hacker-news')
@Controller('api/v1/hacker-news')
export class HackerNewsController {
  private readonly logger = new Logger(HackerNewsController.name);

  constructor(private readonly hackerNewsService: HackerNewsService) {}

  @Post('top-stories')
  @ApiOperation({ summary: 'Get top Hacker News stories with comments' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved stories and comments',
    type: TopStoriesResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiResponse({ status: 504, description: 'Gateway timeout' })
  async getTopStories(
    @Body() request: TopStoriesRequestDto,
  ): Promise<TopStoriesResponseDto> {
    const startTime = Date.now();

    try {
      // Fetch top stories
      const stories = await this.hackerNewsService.getTopStories(
        request.numStories,
      );

      // Fetch comments for each story
      const storiesWithComments = await Promise.all(
        stories.map(async (story) => {
          const comments = await this.hackerNewsService.getStoryComments(
            story.id,
            request.numCommentsPerStory,
          );
          return {
            ...story,
            comments,
          };
        }),
      );

      // Calculate metadata
      const totalComments = storiesWithComments.reduce(
        (sum, story) => sum + story.comments.length,
        0,
      );

      return {
        stories: storiesWithComments,
        meta: {
          fetchedAt: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
          storiesRetrieved: storiesWithComments.length,
          totalCommentsRetrieved: totalComments,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch top stories: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );

      if (error instanceof Error && error.message.includes('between')) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }

      throw new HttpException(
        'Failed to fetch stories',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
