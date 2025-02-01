# Story 4: E2E Testing Implementation with Playwright

## Story

**As a** software engineer\
**I want** comprehensive end-to-end tests using Playwright\
**so that** I can ensure the entire system functions correctly across all environments.

## Status

Draft

## Context

End-to-end testing is crucial for validating that all components of our Hacker News summary service work together seamlessly. We need to verify the complete flow from API requests through to data processing, ensuring our system works correctly in both local and production environments. This includes testing against local DynamoDB instances, LLM integration, and actual HN API calls.

## Estimation

Story Points: 3

## Acceptance Criteria

1. - [ ] Playwright test suite successfully configured with TypeScript
2. - [ ] Environment-specific configuration working (local vs. production)
3. - [ ] Local DynamoDB Docker container integration established
4. - [ ] Complete E2E test coverage for top stories API endpoint
5. - [ ] Tests running successfully against both local and remote environments
6. - [ ] Test reports and documentation completed
7. - [ ] CI/CD pipeline integration completed

## Subtasks

1. - [x] Playwright Setup and Configuration

   1. - [x] Install and configure Playwright with TypeScript
   2. - [x] Set up test environment configuration
   3. - [x] Create Docker compose file for local DynamoDB
   4. - [x] Configure environment variable handling for test environments

2. - [x] Top Stories API E2E Tests

   1. - [x] Create test for successful API response
   2. - [x] Test pagination and limit parameters
   3. - [x] Validate response schema and data types
   4. - [x] Test error handling scenarios

3. - [x] Environment Integration Tests

   1. - [x] Implement local environment test suite
   2. - [x] Implement production environment test suite
   3. - [x] Create environment switching mechanism

4. - [ ] Test Infrastructure
   1. - [x] Set up test reporting
      1. - [x] Configure HTML test reporter for Playwright
      2. - [x] Add test report generation to CI pipeline
      3. - [x] Set up report artifact storage
   2. - [x] Configure CI/CD pipeline integration
      1. - [x] Create GitHub Actions workflow for E2E tests
      2. - [x] Configure test matrix for local and production environments
      3. - [x] Set up proper environment variable handling in CI
   3. - [x] Create test documentation
      1. - [x] Document test setup and configuration
      2. - [x] Document test execution procedures
      3. - [x] Add troubleshooting guide

## Constraints

- Must maintain 80% or higher test coverage
- Tests must be able to run in both local and production environments
- Must handle HN API rate limiting appropriately
- Tests should be idempotent and not affect production data

## Dev Notes

- Use Playwright's built-in assertions and expect library
- Implement proper test isolation and cleanup
- Consider implementing retry logic for flaky external API calls
- Document all environment setup requirements

## Progress Notes As Needed

2024-03-19:

- Installed and configured Playwright for API testing
- Created initial E2E test suite for top stories endpoint
- Set up Docker Compose for local DynamoDB
- Added Playwright test scripts to package.json

2024-03-19 (Update 2):

- Created test environment configuration system using Zod for validation
- Implemented environment-specific configuration loading (.env.local vs .env.production)
- Added new npm scripts for running tests in different environments:
  - `test:e2e:pw`: Run tests against local environment
  - `test:e2e:pw:ui`: Run tests in UI mode against local environment
  - `test:e2e:pw:prod`: Run tests against production environment
- Next: Set up test reporting and CI/CD pipeline integration

2024-03-20:

- Breaking down Test Infrastructure tasks into detailed subtasks
- Next steps:
  1. Implement HTML test reporter configuration
  2. Set up GitHub Actions workflow
  3. Create comprehensive test documentation

2024-03-20 (Update 2):

- Completed all Test Infrastructure tasks:
  1. Configured HTML and list reporters in playwright.config.ts
  2. Created GitHub Actions workflow for automated testing
  3. Added comprehensive test documentation in e2e/README.md
- Story 4 is now complete and ready for review

Next Steps:

1. Review and merge the changes
2. Begin Story 5: POST API Route for Summarized Content
