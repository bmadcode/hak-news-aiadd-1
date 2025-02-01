# Story 8: Email Newsletter Implementation

## Story

**As a** Hacker News enthusiast\
**I want** to receive daily email summaries of top Hacker News stories and comments\
**so that** I can stay informed without spending time browsing the site.

## Status

Draft

## Context

Building upon our existing summarization functionality, we need to implement an email delivery system that will send beautifully formatted HTML emails containing the summarized Hacker News content to subscribers. This involves extending our API to accept email addresses and implementing the email sending functionality using Nodemailer with Gmail.

## Estimation

Story Points: 3

## Acceptance Criteria

1. - [ ] API endpoint accepts an array of email addresses in the request body
2. - [ ] Email HTML template matches the specified format in PRD
3. - [ ] Emails are sent successfully using Nodemailer
4. - [ ] Email includes proper date formatting (MM/DD/YYYY)
5. - [ ] All links in email are properly formatted and clickable
6. - [ ] Unsubscribe link is included in every email
7. - [ ] Error handling for failed email sends is implemented
8. - [ ] Email sending is tested in both local and production environments

## Subtasks

1. - [ ] Email Template Implementation

   1. - [ ] Create HTML email template following PRD specifications
   2. - [ ] Implement date formatting utility
   3. - [ ] Add unsubscribe link to template
   4. - [ ] Create test template with sample data

2. - [ ] Nodemailer Integration

   1. - [ ] Add nodemailer dependencies
   2. - [ ] Create email service class
   3. - [ ] Configure Gmail SMTP settings
   4. - [ ] Implement email sending functionality
   5. - [ ] Add error handling for failed sends

3. - [ ] API Enhancement

   1. - [ ] Modify existing summarization endpoint to accept email addresses
   2. - [ ] Add email validation using Zod
   3. - [ ] Integrate email sending with summarization flow
   4. - [ ] Add appropriate error responses

4. - [ ] Testing
   1. - [ ] Write unit tests for email service
   2. - [ ] Write integration tests for API with email functionality
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

## Progress Notes As Needed
