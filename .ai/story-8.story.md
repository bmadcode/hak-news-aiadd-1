# Story 8: Email Newsletter Implementation

## Story

**As a** Hacker News enthusiast\
**I want** to receive daily email summaries of top Hacker News stories and comments\
**so that** I can stay informed without spending time browsing the site.

## Status

In Progress

## Context

Building upon our existing summarization functionality, we need to implement an email delivery system that will send beautifully formatted HTML emails containing the summarized Hacker News content to subscribers. This involves extending our API to accept email addresses and implementing the email sending functionality using Nodemailer with Gmail.

## Estimation

Story Points: 3

## Acceptance Criteria

1. - [x] API endpoint accepts an array of email addresses in the request body
2. - [x] Email HTML template matches the specified format in PRD
3. - [x] Emails are sent successfully using Nodemailer
4. - [x] Email includes proper date formatting (MM/DD/YYYY)
5. - [x] All links in email are properly formatted and clickable
6. - [ ] Unsubscribe link is included in every email
7. - [x] Error handling for failed email sends is implemented
8. - [ ] Email sending is tested in both local and production environments

## Subtasks

1. - [x] Email Template Implementation

   1. - [x] Create HTML email template following PRD specifications
   2. - [x] Implement date formatting utility
   3. - [ ] Add unsubscribe link to template
   4. - [x] Create test template with sample data

2. - [x] Nodemailer Integration

   1. - [x] Add nodemailer dependencies
   2. - [x] Create email service class
   3. - [x] Configure Gmail SMTP settings
   4. - [x] Implement email sending functionality
   5. - [x] Add error handling for failed sends

3. - [x] API Enhancement

   1. - [x] Modify existing summarization endpoint to accept email addresses
   2. - [x] Add email validation using Zod
   3. - [x] Integrate email sending with summarization flow
   4. - [x] Add appropriate error responses

4. - [ ] Testing
   1. - [x] Write unit tests for email service
   2. - [x] Write integration tests for API with email functionality
   3. - [ ] Add e2e tests using Playwright
   4. - [ ] Test email sending in production environment

## Constraints

1. Must use Nodemailer with Gmail for email sending
2. Must follow exact HTML template format specified in PRD
3. Must handle email sending errors gracefully
4. Must validate email addresses before attempting to send

## Dev Notes

- Gmail SMTP credentials will need to be added to environment variables (loaded from env local and or prod)
- Need to ensure HTML is properly escaped in email template

## Progress Notes

1. Email service implementation complete with proper error handling
2. Template service created with EJS for HTML email generation
3. Unit tests added for both email and template services
4. Added new dev commands for better process management:
   - `npm run dev` - Start development server
   - `npm run dev:restart` - Kill port 3000 and restart server

Remaining Tasks:

1. Implement unsubscribe functionality
2. Complete e2e tests
3. Test in production environment
