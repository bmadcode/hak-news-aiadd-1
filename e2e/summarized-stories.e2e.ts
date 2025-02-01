import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  SummarizedStoriesRequestDto,
  SummarizedStoriesResponseDto,
} from '../src/hacker-news/dto/summarized-stories.dto';

interface ErrorResponse {
  message: string | string[];
  error?: string;
  statusCode?: number;
}

describe('HackerNews Summarized Stories (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/v1/hacker-news/summarized-stories', () => {
    const validRequest: SummarizedStoriesRequestDto = {
      numStories: 2,
      numCommentsPerStory: 2,
      maxSummaryLength: 200,
      includeOriginalContent: false,
    };

    it('should return summarized stories with comments', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/hacker-news/summarized-stories')
        .send(validRequest)
        .expect(201);

      const responseBody =
        response.body as unknown as SummarizedStoriesResponseDto;

      expect(responseBody).toBeDefined();
      expect(responseBody.stories).toBeDefined();
      expect(Array.isArray(responseBody.stories)).toBe(true);
      expect(responseBody.stories.length).toBeLessThanOrEqual(
        validRequest.numStories,
      );

      // Verify story structure
      const story = responseBody.stories[0];
      expect(story).toHaveProperty('id');
      expect(story).toHaveProperty('title');
      expect(story).toHaveProperty('articleSummary');
      expect(story.articleSummary).toHaveProperty('summary');
      expect(story.articleSummary).toHaveProperty('summaryGeneratedAt');
      expect(story.articleSummary).toHaveProperty('tokenCount');

      // Verify comments structure
      expect(story.summarizedComments).toBeDefined();
      expect(Array.isArray(story.summarizedComments)).toBe(true);
      expect(story.summarizedComments.length).toBeLessThanOrEqual(
        validRequest.numCommentsPerStory,
      );

      if (story.summarizedComments.length > 0) {
        const comment = story.summarizedComments[0];
        expect(comment).toHaveProperty('id');
        expect(comment).toHaveProperty('text');
        expect(comment).toHaveProperty('by');
        expect(comment).toHaveProperty('summarizedContent');
        expect(comment.summarizedContent).toHaveProperty('summary');
        expect(comment.summarizedContent).toHaveProperty('summaryGeneratedAt');
        expect(comment.summarizedContent).toHaveProperty('tokenCount');
      }

      // Verify metadata
      expect(responseBody.meta).toBeDefined();
      expect(responseBody.meta).toHaveProperty('fetchedAt');
      expect(responseBody.meta).toHaveProperty('processingTimeMs');
      expect(responseBody.meta).toHaveProperty('storiesRetrieved');
      expect(responseBody.meta).toHaveProperty('totalCommentsRetrieved');
      expect(responseBody.meta).toHaveProperty('totalTokensUsed');
    });

    it('should handle invalid request parameters', async () => {
      const invalidRequest = {
        ...validRequest,
        numStories: 0, // Invalid value
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/hacker-news/summarized-stories')
        .send(invalidRequest)
        .expect(400);

      const errorResponse = response.body as unknown as ErrorResponse;
      expect(errorResponse.message).toContain('between 1 and 10');
    });

    it('should handle missing required parameters', async () => {
      const incompleteRequest = {
        numStories: 1,
        // Missing other required parameters
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/hacker-news/summarized-stories')
        .send(incompleteRequest)
        .expect(400);

      const errorResponse = response.body as unknown as ErrorResponse;
      expect(Array.isArray(errorResponse.message)).toBe(true);
    });

    it('should respect rate limiting', async () => {
      // Make multiple requests in quick succession
      const requests = Array(5).fill(validRequest);
      const responses = await Promise.all(
        requests.map(() =>
          request(app.getHttpServer())
            .post('/api/v1/hacker-news/summarized-stories')
            .send(validRequest),
        ),
      );

      // At least one request should be rate limited
      const rateLimitedResponses = responses.filter((r) => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should include original content when requested', async () => {
      const requestWithOriginal = {
        ...validRequest,
        includeOriginalContent: true,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/hacker-news/summarized-stories')
        .send(requestWithOriginal)
        .expect(201);

      const responseBody =
        response.body as unknown as SummarizedStoriesResponseDto;
      const story = responseBody.stories[0];
      expect(story.articleSummary).toHaveProperty('originalContent');

      if (story.summarizedComments.length > 0) {
        expect(story.summarizedComments[0].summarizedContent).toHaveProperty(
          'originalContent',
        );
      }
    });
  });
});
