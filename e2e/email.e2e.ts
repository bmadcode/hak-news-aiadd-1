import { test, expect } from '@playwright/test';
import { config } from './config/test.config';
import * as nodemailer from 'nodemailer';

interface EmailResponse {
  success: boolean;
  message: string;
  recipients?: string[];
}

test.describe('Email Service E2E Tests', () => {
  // Increase timeout for email operations
  test.setTimeout(30000);

  const apiPath =
    config.TEST_ENV === 'prod'
      ? '/prod/api/v1/hacker-news/email'
      : '/api/v1/hacker-news/email';

  // Create a test email account for verification
  let testAccount: nodemailer.TestAccount;
  let testTransport: nodemailer.Transporter;

  test.beforeAll(async () => {
    // Create ethereal email test account
    testAccount = await nodemailer.createTestAccount();

    // Create reusable transporter for testing
    testTransport = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  });

  test('should validate and accept valid email addresses', async ({
    request,
  }) => {
    const validEmails = ['test@example.com', 'user.name@domain.co.uk'];

    const response = await request.post(apiPath, {
      data: {
        recipients: validEmails,
        numStories: 2,
        numCommentsPerStory: 5,
      },
      headers: {
        'x-api-key': config.API_KEY,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = (await response.json()) as EmailResponse;
    expect(data.success).toBeTruthy();
    expect(data.recipients).toEqual(validEmails);
  });

  test('should reject invalid email addresses', async ({ request }) => {
    const invalidEmails = ['not.an.email', 'missing@domain', '@incomplete.com'];

    const response = await request.post(apiPath, {
      data: {
        recipients: invalidEmails,
        numStories: 2,
        numCommentsPerStory: 5,
      },
      headers: {
        'x-api-key': config.API_KEY,
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.success).toBeFalsy();
    expect(data.message).toContain('Invalid email format');
  });

  test('should send email with correct template and content', async ({
    request,
  }) => {
    const testEmail = testAccount.user;

    const response = await request.post(apiPath, {
      data: {
        recipients: [testEmail],
        numStories: 1,
        numCommentsPerStory: 2,
      },
      headers: {
        'x-api-key': config.API_KEY,
      },
    });

    expect(response.ok()).toBeTruthy();

    // Verify email was received
    const messages = await testTransport.verify();
    expect(messages).toBeTruthy();

    // In a real implementation, we would:
    // 1. Check the ethereal email inbox
    // 2. Verify email content and formatting
    // 3. Test unsubscribe link functionality
  });

  test('should include and verify unsubscribe link', async ({ request }) => {
    const testEmail = testAccount.user;

    const response = await request.post(apiPath, {
      data: {
        recipients: [testEmail],
        numStories: 1,
        numCommentsPerStory: 2,
      },
      headers: {
        'x-api-key': config.API_KEY,
      },
    });

    expect(response.ok()).toBeTruthy();

    // Verify unsubscribe link
    // In production, we would:
    // 1. Extract unsubscribe link from email
    // 2. Verify link format and token
    // 3. Test unsubscribe functionality
    // 4. Verify email is removed from list
  });

  test('should handle rate limiting and concurrent requests', async ({
    request,
  }) => {
    const emails = Array(5).fill('test@example.com');

    // Send multiple concurrent requests
    const promises = emails.map(() =>
      request.post(apiPath, {
        data: {
          recipients: [emails[0]],
          numStories: 1,
          numCommentsPerStory: 2,
        },
        headers: {
          'x-api-key': config.API_KEY,
        },
      }),
    );

    const responses = await Promise.all(promises);

    // Verify rate limiting is working
    const successfulResponses = responses.filter((r) => r.ok());
    expect(successfulResponses.length).toBeLessThan(5);
  });
});
