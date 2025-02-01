# Story 5: POST API Route for Summarized Content

## Story

**As a** user of the Hacker News API service\
**I want** to get summarized versions of top posts, their articles, and comments\
**so that** I can quickly understand the key points without reading everything in detail.

## Status

Draft

## Context

Building upon our existing Hacker News API integration, we need to create a new endpoint that not only fetches posts, articles, and comments but also provides AI-generated summaries of this content. This feature will leverage an LLM service (configured via environment variables) to generate concise summaries of both the articles and their associated comments, making it easier for users to digest large amounts of Hacker News content efficiently.

## Estimation

Story Points: 5

## Acceptance Criteria

1. - [ ] New POST endpoint created at `/api/v1/summarized-stories`
2. - [ ] Endpoint accepts parameters for number of posts, articles, and comments
3. - [ ] Successfully retrieves raw content using existing HN service
4. - [ ] Integrates with configured LLM service for summarization
5. - [ ] Returns summarized content in structured format
6. - [ ] Environment variables properly configured for LLM service
7. - [ ] CLI command added to package.json for testing
8. - [ ] Documentation updated with new endpoint details
9. - [ ] Error handling for LLM service failures
10. - [ ] Rate limiting implemented for API endpoint

## Subtasks

1. - [ ] API Endpoint Implementation

   1. - [ ] Create DTO for request parameters
   2. - [ ] Create DTO for summarized response
   3. - [ ] Implement controller endpoint
   4. - [ ] Add OpenAPI documentation
   5. - [ ] Implement request validation

2. - [ ] LLM Integration

   1. - [ ] Create LLM service interface
   2. - [ ] Implement LLM configuration from env vars
   3. - [ ] Create article summarization method
   4. - [ ] Create comments summarization method
   5. - [ ] Add error handling for LLM failures

3. - [ ] Service Integration

   1. - [ ] Create summarization service
   2. - [ ] Integrate with existing HN service
   3. - [ ] Implement content processing pipeline
   4. - [ ] Add caching for summarized content
   5. - [ ] Implement rate limiting

4. - [ ] Testing & Documentation
   1. - [ ] Write unit tests for new components
   2. - [ ] Write integration tests
   3. - [ ] Update API documentation
   4. - [ ] Add CLI command to package.json
   5. - [ ] Create usage examples

## Constraints

- Must handle LLM API failures gracefully
- Must implement proper rate limiting
- Must cache summarized content to avoid redundant LLM calls
- Must validate and sanitize all input
- Must maintain type safety throughout the implementation
- Must follow existing architectural patterns

## Dev Notes

- Use dependency injection for LLM service
- Consider implementing circuit breaker for LLM service
- Use proper error handling and logging
- Consider implementing retry mechanism for LLM API calls
- Cache summarized content with appropriate TTL
- Use proper TypeScript types throughout

## Progress Notes As Needed

2024-03-20:

- Created story file with detailed requirements
- Next steps:
  1. Begin with API endpoint implementation
  2. Set up LLM service integration
  3. Implement core summarization logic
