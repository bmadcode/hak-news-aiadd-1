import { test, expect } from '@playwright/test';
import { config } from './config/test.config';

interface Story {
  id: number;
  title: string;
  url: string;
  comments: Comment[];
}

interface Comment {
  id: number;
  text: string;
  by: string;
}

interface TopStoriesResponse {
  stories: Story[];
}

interface ErrorResponse {
  message: string;
  statusCode?: number;
  error?: string;
}

test.describe('Top Stories API', () => {
  const apiPath =
    config.TEST_ENV === 'prod'
      ? '/prod/api/v1/hacker-news/top-stories'
      : '/api/v1/hacker-news/top-stories';

  test('should return top stories successfully', async ({ request }) => {
    const response = await request.post(apiPath, {
      data: {
        numStories: 5,
        numCommentsPerStory: 2,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = (await response.json()) as TopStoriesResponse;

    // Validate response structure
    expect(data).toHaveProperty('stories');
    expect(Array.isArray(data.stories)).toBeTruthy();
    expect(data.stories.length).toBeLessThanOrEqual(5);

    // Validate story structure
    const firstStory = data.stories[0];
    expect(firstStory).toHaveProperty('id');
    expect(firstStory).toHaveProperty('title');
    expect(firstStory).toHaveProperty('url');
    expect(firstStory).toHaveProperty('comments');
    expect(Array.isArray(firstStory.comments)).toBeTruthy();
    expect(firstStory.comments.length).toBeLessThanOrEqual(2);
  });

  test('should handle invalid input gracefully', async ({ request }) => {
    const response = await request.post(apiPath, {
      data: {
        numStories: -1,
        numCommentsPerStory: 'invalid',
      },
    });

    expect(response.status()).toBe(400);
    const error = (await response.json()) as ErrorResponse;
    expect(error).toHaveProperty('message');
    expect(error.message).toContain('must be between');
  });
});
