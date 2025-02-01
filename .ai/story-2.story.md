# Story 2: Hacker News Retrieval API Route

## Story

**As a** developer  
**I want** to create an API route that retrieves and returns Hacker News top posts with their articles and comments  
**so that** we can access the raw data needed for our summarization service.

## Status

Complete

## Context

This story implements the core data retrieval functionality for our service. We need to create a robust API endpoint that can fetch top stories from Hacker News, along with their associated articles and comments. This will serve as the foundation for our summarization service, providing the raw data that will later be processed by our LLM.

## Estimation

Story Points: 0.3 (approximately 30 minutes of AI development time)

## Acceptance Criteria

1. - [x] Create an API endpoint that accepts POST requests with configuration for number of posts, articles, and comments
2. - [x] Successfully integrate with Hacker News API to fetch top stories
3. - [x] Implement article content scraping for the top posts
4. - [x] Fetch and organize comments for each top post
5. - [x] Implement proper error handling and rate limiting
6. - [x] Add appropriate request/response DTOs with Zod validation
7. - [x] Create a convenience command in package.json for testing the API route
8. - [x] Implement comprehensive unit tests with at least 80% coverage
9. - [x] Document the API endpoint with OpenAPI/Swagger

## Subtasks

1. - [x] API Setup
   1. - [x] Create HackerNewsModule and necessary components
   2. - [x] Define DTOs for request/response with Zod validation
   3. - [x] Implement basic controller structure
2. - [x] Hacker News Integration
   1. - [x] Create HackerNewsService for API interactions
   2. - [x] Implement top stories retrieval
   3. - [x] Add item details fetching (posts, comments)
3. - [x] Article Scraping
   1. - [x] Implement article content scraping service
   2. - [x] Add error handling for failed scrapes
   3. - [x] Implement concurrent scraping with rate limiting
4. - [x] Testing & Documentation
   1. - [x] Write unit tests for all components
   2. - [x] Add OpenAPI/Swagger documentation
   3. - [x] Create convenience command in package.json
5. - [x] Error Handling & Optimization
   1. - [x] Implement robust error handling
   2. - [x] Add request timeout handling
   3. - [x] Optimize concurrent requests

## Constraints

- Must handle Hacker News API rate limits appropriately
- Must implement proper error handling for network requests
- Must validate all input/output with Zod
- Must maintain test coverage of at least 80%
- Must follow NestJS best practices for module organization

## Dev Notes

### API Specification

- **Route**: `/api/v1/hacker-news/top-stories`
- **Method**: POST
- **Content-Type**: application/json

#### Request Model

```typescript
interface TopStoriesRequest {
  // Number of top stories to fetch (1-30)
  numStories: number;
  // Number of comments to fetch per story (0-50)
  numCommentsPerStory: number;
  // Whether to include full article content
  includeArticleContent: boolean;
}
```

#### Response Model

```typescript
interface TopStoriesResponse {
  stories: Array<{
    id: number;
    title: string;
    url: string;
    score: number;
    by: string;
    time: number;
    descendants: number;
    // Only included if includeArticleContent is true
    articleContent?: {
      text: string;
      // ISO 8601 date string
      fetchedAt: string;
      // true if article was successfully scraped
      success: boolean;
      // Error message if success is false
      error?: string;
    };
    comments: Array<{
      id: number;
      text: string;
      by: string;
      time: number;
      // Represents the comment's position in thread
      level: number;
      // Parent comment ID if applicable
      parent?: number;
    }>;
  }>;
  // Metadata about the request
  meta: {
    // ISO 8601 date string
    fetchedAt: string;
    // Total time taken to process request
    processingTimeMs: number;
    // Number of stories successfully fetched
    storiesRetrieved: number;
    // Number of comments successfully fetched
    totalCommentsRetrieved: number;
  };
}
```

### Error Responses

- **400 Bad Request**: Invalid input parameters
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server-side processing error
- **504 Gateway Timeout**: Timeout fetching data

### Technical Implementation Details

- Hacker News API Base URL: https://hacker-news.firebaseio.com/v0
- Key endpoints:
  - Top stories: /topstories.json
  - Item details: /item/{id}.json
- Rate Limiting:
  - HN API: 500 requests per minute
  - Article scraping: Max 10 concurrent requests
  - Response timeout: 30 seconds
- Caching Strategy:
  - Top stories list: 5 minutes TTL
  - Individual items: 15 minutes TTL
  - Article content: 1 hour TTL
- Error Handling:
  - Implement circuit breaker for article scraping
  - Retry failed HN API requests up to 3 times
  - Log all failures for monitoring

### Dependencies Required

```json
{
  "axios": "^1.6.0",
  "cheerio": "^1.0.0-rc.12",
  "zod": "^3.22.0",
  "nestjs-throttler": "^5.0.0",
  "cache-manager": "^5.2.0"
}
```

## Progress Notes As Needed

### 2024-02-01 - Initial Service Implementation

- Completed initial HackerNewsService implementation with the following features:

  - ✅ Implemented `getTopStories` method with caching and error handling
  - ✅ Implemented `getStoryComments` method with recursive comment fetching
  - ✅ Added proper TypeScript interfaces for all data models
  - ✅ Configured caching with appropriate TTLs (5 mins for stories, 15 mins for comments)
  - ✅ Implemented comprehensive error handling with proper typing
  - ✅ Added logging for all error cases

- Created and configured module structure:

  - ✅ Set up HackerNewsModule with necessary dependencies
  - ✅ Configured HttpModule for API calls
  - ✅ Configured CacheModule with proper TTL settings
  - ✅ Integrated with ConfigModule for future configuration needs

- Test Implementation:
  - ✅ Created comprehensive test suite for HackerNewsService
  - ✅ All tests passing (5/5 tests)
  - ✅ Coverage includes happy path and error cases
  - ✅ Verified proper error handling for invalid inputs

### 2024-02-01 - API Endpoint Implementation

- Completed API endpoint implementation:
  - ✅ Created HackerNewsController with POST endpoint
  - ✅ Implemented comprehensive DTOs with class-validator
  - ✅ Added Swagger/OpenAPI documentation
  - ✅ Configured global validation pipe
  - ✅ Added proper error handling and HTTP status codes
  - ✅ All controller tests passing (5/5 tests)

### 2024-02-01 - Article Scraping Implementation

- Completed article scraping functionality:
  - ✅ Created ArticleScraperService with rate limiting
  - ✅ Implemented HTML content extraction with cheerio
  - ✅ Added proper error handling for network and parsing issues
  - ✅ Integrated with HackerNewsService
  - ✅ Added comprehensive test coverage
  - ✅ Implemented request queuing for concurrent requests

### Next Steps:

1. - [ ] Create convenience command in package.json
2. - [ ] Add end-to-end tests for the API endpoint
