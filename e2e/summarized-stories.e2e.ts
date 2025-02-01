import { test, expect } from '@playwright/test';
import { config } from './config/test.config';

interface ErrorResponse {
  message: string | string[];
  error?: string;
  statusCode?: number;
}

interface SummarizedStory {
  id: number;
  title: string;
  url: string;
  articleSummary: {
    summary: string;
    summaryGeneratedAt: string;
    tokenCount: number;
    originalContent?: string;
  };
  summarizedComments: {
    id: number;
    text: string;
    by: string;
    summarizedContent: {
      summary: string;
      summaryGeneratedAt: string;
      tokenCount: number;
      originalContent?: string;
    };
  }[];
  meta: {
    fetchedAt: string;
    processingTimeMs: number;
    storiesRetrieved: number;
    totalCommentsRetrieved: number;
    totalTokensUsed: number;
  };
}

interface SummarizedStoriesResponse {
  stories: SummarizedStory[];
}

test.describe('Summarized Stories API', () => {
  // Increase test timeout for LLM operations
  test.setTimeout(120000);

  const apiPath =
    config.TEST_ENV === 'prod'
      ? '/prod/api/v1/hacker-news/summarized-stories'
      : '/api/v1/hacker-news/summarized-stories';

  test('should return summarized stories successfully', async ({ request }) => {
    const response = await request.post(apiPath, {
      data: {
        numStories: 3,
        numCommentsPerStory: 5,
        maxSummaryLength: 200,
        includeOriginalContent: false,
      },
      headers: {
        'x-api-key': config.API_KEY,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = (await response.json()) as SummarizedStoriesResponse;

    // Validate response structure
    expect(data).toHaveProperty('stories');
    expect(Array.isArray(data.stories)).toBeTruthy();
    expect(data.stories.length).toBeLessThanOrEqual(3);

    // Validate story structure and summaries
    const firstStory = data.stories[0];
    expect(firstStory).toHaveProperty('id');
    expect(firstStory).toHaveProperty('title');
    expect(firstStory).toHaveProperty('url');
    expect(firstStory).toHaveProperty('articleSummary');
    expect(firstStory.articleSummary).toHaveProperty('summary');
    expect(firstStory.articleSummary).toHaveProperty('summaryGeneratedAt');
    expect(firstStory.articleSummary).toHaveProperty('tokenCount');

    // Verify no LLM thinking tags in summaries
    expect(firstStory.articleSummary.summary).not.toContain(
      '<LLM_THINKING_TAG>',
    );

    // Validate summarized comments
    expect(firstStory).toHaveProperty('summarizedComments');
    expect(Array.isArray(firstStory.summarizedComments)).toBeTruthy();
    expect(firstStory.summarizedComments.length).toBeLessThanOrEqual(5);

    if (firstStory.summarizedComments.length > 0) {
      const firstComment = firstStory.summarizedComments[0];
      expect(firstComment).toHaveProperty('id');
      expect(firstComment).toHaveProperty('text');
      expect(firstComment).toHaveProperty('by');
      expect(firstComment).toHaveProperty('summarizedContent');
      expect(firstComment.summarizedContent.summary).not.toContain(
        '<LLM_THINKING_TAG>',
      );
    }

    // Validate metadata
    expect(firstStory).toHaveProperty('meta');
    expect(firstStory.meta).toHaveProperty('fetchedAt');
    expect(firstStory.meta).toHaveProperty('processingTimeMs');
    expect(firstStory.meta).toHaveProperty('storiesRetrieved');
    expect(firstStory.meta).toHaveProperty('totalCommentsRetrieved');
    expect(firstStory.meta).toHaveProperty('totalTokensUsed');
  });

  test('should include original content when requested', async ({
    request,
  }) => {
    const response = await request.post(apiPath, {
      data: {
        numStories: 1,
        numCommentsPerStory: 2,
        maxSummaryLength: 300,
        includeOriginalContent: true,
      },
      headers: {
        'x-api-key': config.API_KEY,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = (await response.json()) as SummarizedStoriesResponse;
    const firstStory = data.stories[0];

    expect(firstStory.articleSummary).toHaveProperty('originalContent');
    if (firstStory.summarizedComments.length > 0) {
      expect(firstStory.summarizedComments[0].summarizedContent).toHaveProperty(
        'originalContent',
      );
    }
  });

  test('should handle invalid input gracefully', async ({ request }) => {
    const response = await request.post(apiPath, {
      data: {
        numStories: -1,
        numCommentsPerStory: 'invalid',
      },
      headers: {
        'x-api-key': config.API_KEY,
      },
    });

    expect(response.status()).toBe(400);
    const error = (await response.json()) as ErrorResponse;
    expect(error).toHaveProperty('message');
    expect(Array.isArray(error.message)).toBe(true);
    expect(error.message).toContain('numStories must not be less than 1');
    expect(error.message).toContain(
      'numCommentsPerStory must be an integer number',
    );
  });

  test('should enforce rate limiting', async ({ request }) => {
    const makeRequest = () =>
      request.post(apiPath, {
        data: {
          numStories: 1,
          numCommentsPerStory: 1,
          maxSummaryLength: 200,
        },
        headers: {
          'x-api-key': config.API_KEY,
        },
      });

    // Make multiple requests in quick succession
    const responses = await Promise.all([
      makeRequest(),
      makeRequest(),
      makeRequest(),
      makeRequest(),
      makeRequest(),
    ]);

    // At least one request should be rate limited
    const rateLimited = responses.some((response) => response.status() === 429);
    expect(rateLimited).toBeTruthy();
  });

  test('should handle missing API key', async ({ request }) => {
    const response = await request.post(apiPath, {
      data: {
        numStories: 1,
        numCommentsPerStory: 1,
      },
    });

    expect(response.status()).toBe(401);
    const error = (await response.json()) as ErrorResponse;
    expect(error).toHaveProperty('message');
    expect(error.message).toContain('API key');
  });
});
