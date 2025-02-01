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
  commentsSummary: {
    summary: string;
    summaryGeneratedAt: string;
    tokenCount: number;
    originalContent?: string;
  };
  comments: {
    id: number;
    text: string;
    by: string;
    time: number;
    parent: number;
    kids?: number[];
    level: number;
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
        numStories: 2,
        numCommentsPerStory: 5,
        maxSummaryLength: 300,
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

    // Validate comments summary
    expect(firstStory).toHaveProperty('commentsSummary');
    expect(firstStory.commentsSummary).toHaveProperty('summary');
    expect(firstStory.commentsSummary).toHaveProperty('summaryGeneratedAt');
    expect(firstStory.commentsSummary).toHaveProperty('tokenCount');
    expect(firstStory.commentsSummary.summary).not.toContain(
      '<LLM_THINKING_TAG>',
    );
  });
});
