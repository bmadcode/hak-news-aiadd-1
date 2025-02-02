# Product Requirements Document (PRD)

## Goal

Create a service that sends daily summaries of the top **M** stories along with up to **N** comments from Hacker News, Summarized by an LLM, to subscribers.

## Tasks

- Story 1: NestJS Configuration
  - Install NestJS CLI Globally
  - Create a new NestJS project with the nestJS cli generator
- Story 2: Hacker News Retrieval API Route
  - Create API Route that Returns A list of Hacker News TopPosts, Scrapped Article from the top posts, and a list of comments from the top posts
  - Route post body specifies the number of posts, articles, and comments to return
  - Create a Command in Package.json that I can use to call the API Route (route configured in env.local)
- Story 3: Configure and Deploy CDK Stack
  - Use AWS api gateway API-KEY for the API Route security of all routes
  - Deploy CDK Stack to AWS
  - Ensure that the command in Package.json is working with the env vars from env.production against remote AWS API
- Story 4: E2E Testing with Playwright
  - Use **Playwright** to test API endpoints.
  - Use local **DynamoDB (Docker)**, the configured LLM, and local API endpoints when configured to test against local apis.
  - have a way to also run tests against remote so it uses the env.production values instead to find APIs to call
  - Makes actual network calls to HN API
  - Tests complete flows from HTTP request to email generation
- Story 5: POST API Route to Get N Summarized Post/Article/Comments results
  - Create a new API Route that returns N Summarized Post/Article/Comments results
  - Route post body specifies the number of posts, articles, and comments to return
  - Ensure <LLM_THINKING_TAG> tags are removed from the response if/when the LLM_THINKING_TAG is set and the response includes the <LLM_THINKING_TAG> tags
  - The summarization will be a paragraph to summarize the linked article if retrievable, and a paragraph to collectively summarize the comments.
  - The summarization LLM route, api key, model will be set in the environment variables
  - Route uses service code from Story 2 (HN Retrieval) to get the raw data from HN API and then uses the LLM to summarize the data
  - Create a Command in Package.json that I can use to call the API Route (route configured in env.local)
  - Ensure that the command in Package.json is working with the env vars from env.production
  - Ensure that the command in Package.json is working against local with vars from env.local
- Story 6: Playwright Test for the Summarized Post/Article/Comments API Route
  - Use Playwright to test the API Route
  - Use local DynamoDB (Docker), the configured LLM, and local API endpoints when configured to test against local apis.
  - Make actual network calls to HN API in all test environments
  - since we cannot control the actualy results, these tests will just validate there are no errors and the response is valid with some summarized text
  - deploy and ensure all passes in the production environment
  - Story 7: There should only be a single summarization route, remove the route to get hacker news stories and comments.
  - remove top stories e2e
  - remove the route to get top stories raw hacker news data
  - remove the command to get top stories
  - the only be the command to get all summaries of posts, articles, and comments
- Story 8: Email Summaries as a News Letter

  - The Summaries API Route will send an email to the email address in the post body emails: [email1, email2, email3...]
  - The Email Body will be the rendered html of the email body
  - The format of the HTML will be the following template:

    This is the Daily Hacker News Top Summary from BMad for Date (MM/DD/YYYY)

          Story 1 // Bold Centered
          The Title as a URL // the URL test will be the title, the link will be the url
          Story 1 Summary: Summary of the story

          Story 1 Comment Summary: Summary of the comments

          ***

          Story 2 // Bold Centered
          The Title as a URL // the URL test will be the title, the link will be the url
          Story 2 Summary: Summary of the story

          Story 2 Comment Summary: Summary of the comments

          ***

          ...etc for each story

          ***

          Thank you for subscribing to the BMad Hacker News Summary
          - Brian BMad Madison

          You can unsubscribe at any time by clicking the link below

          [Unsubscribe](https://www.youtube.com/watch?v=dQw4w9WgXcQ)

  - Story 9: use email subscriptions to send the emails
    - use a dynamodb table to store the email addresses
    - use a lambda function to add email addresses to the table
    - use a lambda function to remove email addresses from the table

- Story 10: Add a Dev Environment to test new changes without breaking production
  - Add a dev environment to test new changes without breaking production
  - Ensure we are able to deploy to dev and production environments with different commands (same env vars come from .env.production) and both work exactly the same
- Story 11: Cache HTML in DynamoDB & Async Optimization
  - Task 1:The existing Summaries API Route will be updated to ONLY do the following:
    - Post Body modified to include a subscriptionId (HakNewsDaily)
    - Write a row to the DynamoDB table with the following properties:
      - PK: SUB::SUMMARY
      - SK: SUMMARY::<mmddyyyy>::HakNewsDaily::POSTCOUNT::COMMENTCOUNT (ex. SUMMARY::20250202::HakNewsDaily::10::10)
      - dtCreated: DateTime of the summary row creation
      - dtSummarized: default null, DateTime of the summary generation added to the row when summaryHtml is updated
      - summaryHtml: '' // on create this is empty string
    - The Row will have a TTL of (subscriptionTTL from env vars) hours
    - The response will be a 202 Accepted status code
    - Ensure the call to the route no longer:
      - Gets HN articles or comments before responding
      - Calls the LLM service before responding
      - Caches the HTML in DynamoDB before responding
      - Sends the email before responding
  - Task 2: Create TST and Create Lambda to handle to generate the summary and send the email
    - TST on dyanmo table on create or update of a row with the pk of SUB::SUMMARY
      - Lambda TST controller will: - If the row summaryHtml is ('' or null) AND date is today, then: - Get the HN articles and comments based on the values in the row SK with the hacker-news service - Call the llm service to summarize the articles and comments and store the summaryHtml in the row - Use the same template that the email service was using, but refactor so it is replicated in this lambda (a later task will remove it from the email service) - If the row summaryHtml is not ('' or null) AND date is today, then DO NOTHING but log a message to the console - If the row date is not today, then DO NOTHING but log a message to the console
        -Task 3: The TST controller will be updated to use the email service to send the emails of the summaryHtml to the email addresses in the row
      - The email service will have a new function that takes in as a param the htmlSummary and the subscriptionId
      - The email service will send the email to the esubscribers defined in dynamo table with the pk of `sub:hakdaily`
      - The email service no longer needs to take in json and generate the html, it will just take in the html and send the email, this code can be refactored out of the email service

## Testing Strategy

- **Unit Tests:** Test each unit of the application in isolation.
  - Use `@shelf/jest-dynamodb` to test DynamoDB interactions.
  - Must use Jest
- **Integration Tests:** Test how different units of the application work together.
  - Example: Testing if the HN API service and LLM service work together correctly
  - Uses mocks for external dependencies (HN API, LLM API)
  - Runs in-memory, no real network calls
- **End-to-End (e2e) Tests:** Test the entire system as specified in our PRD
  - Use **Playwright** to test API endpoints.
  - Use local **DynamoDB (Docker)**, the configured LLM, and local API endpoints.
  - Makes actual network calls to HN API
  - Tests complete flows from HTTP request to email generation

## Tech Stack

- **Backend:**
  - **Node.js 22**
  - **TypeScript**
  - **AWS SDK V3**: AWS SDK for JavaScript v3
  - **NestJS**: v10 Framework for building server-side applications
- **Testing:**
  - **Jest** (Unit Testing)
  - **Playwright** (e2e Testing)
- **Tooling & Utilities:**
  - **Zod** (Schema Validation)
- **AI & Email Services:**
  - **Deepseek R1** (Local & Remote LLM, configured via `.env`)
  - **Nodemailer (Gmail)** (Email Sending)
- **AWS Services (Free Tier):**
  - **CDK** (Infrastructure-as-Code)
  - **Lambda** (Function Execution)
  - **DynamoDB** (Database)
  - **CloudWatch** (Logging & Monitoring)
  - **API Gateway** (REST API Management)
  - **SQS** (Queue for Job Processing)
