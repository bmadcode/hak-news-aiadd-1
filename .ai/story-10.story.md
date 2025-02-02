# Story 10: Cache HTML in DynamoDB & Async Optimization

## Story

**As a** System Architect\
**I want** to implement asynchronous processing and caching for HN summaries\
**so that** we can optimize performance, reduce latency, and improve system reliability.

## Status

Draft

## Context

Currently, our summary generation process is synchronous, causing longer response times and potential timeout issues. By implementing asynchronous processing and caching in DynamoDB, we can provide immediate responses to clients while processing summaries in the background. This architectural change will improve scalability and user experience while maintaining data consistency.

The system will use a combination of DynamoDB for caching, Lambda functions for async processing, and our existing email service for delivery. This approach follows cloud-native best practices and ensures efficient resource utilization.

## Estimation

Story Points: 3

## Acceptance Criteria

1. - [ ] Modified Summarize API Route returns 202 Accepted status immediately after creating DynamoDB entry
2. - [ ] Modified Newsletter API to send emails of cached summaries to subscribers if it exists and then respond with 200. If there is no cached summary for today in dynamo, then respond with an error message indicating the user should instead call the summarize endpoint first to generate todays summary along with a status 400.
3. - [ ] DynamoDB table correctly stores summary data with appropriate TTL
4. - [ ] TST Lambda function successfully processes new summary requests
5. - [ ] Email service correctly sends cached summaries to subscribers
6. - [ ] All operations are properly logged in CloudWatch
7. - [ ] System handles edge cases (duplicate requests, invalid data) gracefully
8. - [ ] Existing unit tests updated and new tests added for async functionality
9. - [ ] E2E tests verify complete async workflow

## Subtasks

1. - [ ] Update Summaries API Route

   1. - [ ] Rename the hacker-news controller to summaries.controller.ts and the controller name to SummariesController
   2. - [ ] Modify route to accept subscriptionId in post body
   3. - [ ] Implement DynamoDB row creation with specified schema
   4. - [ ] Add TTL configuration based on env vars
   5. - [ ] Remove synchronous processing logic
   6. - [ ] Update response to return 202 Accepted
   7. - [ ] Add unit tests for modified route

2. - [ ] Update Newsletter API Route

   1. - [ ] Refactor the newsletter to a separate controller file
   2. - [ ] Route checks for existing summary in DynamoDB for today
   3. - [ ] If summary exists, send emails configured in dynamo and respond with 200 and the list of emails that were sent to
   4. - [ ] If summary does not exist, respond with 400 and a message to `call the summarize endpoint first, no summary found for today`
   5. - [ ] Add unit tests for modified route
   6. - [ ] ensure route no longer results in calls to getSummarizedStories function in the hacker-news.controller.ts file

3. - [ ] Implement TST Lambda Function

   1. - [ ] Create Lambda function for TST controller
   2. - [ ] Add DynamoDB stream trigger configuration
   3. - [ ] Implement logic to check summaryHtml status
   4. - [ ] Add date validation logic
   5. - [ ] Integrate existing HN and LLM services
   6. - [ ] Implement HTML template generation
   7. - [ ] Add comprehensive error handling
   8. - [ ] Add unit tests for Lambda function

4. - [ ] Update Email Service Integration
   1. - [ ] Create new email service function for HTML summary
   2. - [ ] Modify subscription lookup logic
   3. - [ ] Remove redundant HTML generation code
   4. - [ ] Add error handling for email sending
   5. - [ ] Update unit tests for email service

## Constraints

1. Must maintain backward compatibility with existing email templates
2. Lambda function timeout should be configured appropriately for LLM processing
3. DynamoDB TTL must be configurable via environment variables
4. Must handle rate limiting for both HN API and LLM service
5. Must maintain existing security measures (API keys, etc.)

## Dev Notes

### DynamoDB Schema

```typescript
interface SummaryRow {
  PK: string; // Format: "SUB::SUMMARY"
  SK: string; // Format: "SUMMARY::<mmddyyyy>::HakNewsDaily::<POSTCOUNT>::<COMMENTCOUNT>"
  dtCreated: string; // ISO DateTime
  dtSummarized: string; // ISO DateTime | null
  summaryHtml: string; // Empty string on create
  ttl: number; // Computed from subscriptionTTL env var
}
```

### Environment Variables

- `SUBSCRIPTION_TTL_HOURS`: Number of hours before summary cache expires
- Existing env vars for LLM, HN API, and email service remain unchanged

### Error Handling Strategy

1. Lambda retries: Configure with exponential backoff
2. DynamoDB operations: Use transactions where appropriate
3. Email sending: Implement retry mechanism with backoff

## Progress Notes As Needed
