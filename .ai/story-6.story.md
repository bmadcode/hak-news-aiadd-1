# Story 6: Playwright Test for the Summarized Post/Article/Comments API Route

## Story

**As a** developer\
**I want** comprehensive end-to-end tests for the summarized content API route\
**so that** I can ensure the feature works reliably in both local and production environments.

## Status

Closed - Will Not Do

## Context

With the completion of Story 5's summarized content API route, we need to ensure its reliability through comprehensive end-to-end testing. These tests will verify the entire flow from HTTP request to response, including interactions with the HN API and LLM service. Since we cannot control the actual content from Hacker News, our tests will focus on validating the structure and presence of summarized content rather than specific content values.

Note: This story has been closed as we are proceeding directly to Story 7 to consolidate our API routes.

## Estimation

Story Points: 3

## Acceptance Criteria

- [ ] Create Playwright test suite for the summarized content API endpoint
- [ ] Implement tests for both local and production environments
- [ ] Verify proper handling of various input parameters (number of posts, comments)
- [ ] Validate response structure and data types
- [ ] Ensure proper error handling for invalid inputs
- [ ] Verify LLM thinking tags are properly removed
- [ ] Test rate limiting functionality
- [ ] Document test setup and configuration requirements

## Subtasks

1. - [ ] Test Environment Setup
   - [ ] Configure Playwright for API testing
   - [ ] Set up test configuration for local environment
   - [ ] Set up test configuration for production environment
   - [ ] Configure environment variable handling

2. - [ ] Core Test Implementation
   - [ ] Create base test utilities and helpers
   - [ ] Implement happy path test cases
   - [ ] Add error handling test cases
   - [ ] Add rate limiting test cases
   - [ ] Add parameter validation test cases

3. - [ ] Response Validation
   - [ ] Implement schema validation for responses
   - [ ] Add checks for LLM thinking tag removal
   - [ ] Verify summary structure and content types
   - [ ] Add response timing validation

4. - [ ] Documentation & Cleanup
   - [ ] Add test documentation
   - [ ] Create test run instructions
   - [ ] Add CI/CD integration notes
   - [ ] Review and optimize test performance

## Constraints

- Must work with both local and production environments
- Cannot make assumptions about specific HN content
- Must handle network timeouts gracefully
- Must be able to run in CI/CD pipeline
- Should complete within reasonable time limits

## Dev Notes

- Using Playwright for its robust API testing capabilities
- Will need to handle environment-specific configurations
- Focus on structural validation rather than specific content
- Consider implementing retry logic for flaky network conditions

## Progress Notes

1. Story file created with initial requirements
2. Created e2e test file `summarized-stories.e2e.ts` with:
   - Basic test structure following existing patterns
   - Comprehensive validation of response structure
   - LLM thinking tag removal verification
   - Rate limiting tests
   - API key validation
   - Error handling tests

## Next Steps

1. Run the tests to verify implementation
2. Add any necessary configuration updates
3. Document test setup and execution process
