# E2E Testing Documentation

## Overview

This directory contains end-to-end tests for the Hacker News API service using Playwright. The tests cover both local and production environments and include API endpoint testing with real network calls to the Hacker News API.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Install Playwright browsers:

   ```bash
   npx playwright install --with-deps
   ```

3. Configure environment variables:
   - Local testing: `.env.local`
   - Production testing: `.env.production`

## Running Tests

### Local Environment

```bash
# Run tests
npm run test:e2e:pw

# Run tests with UI
npm run test:e2e:pw:ui
```

### Production Environment

```bash
npm run test:e2e:pw:prod
```

## Test Reports

HTML test reports are automatically generated after each test run:

1. Open `playwright-report/index.html` in your browser
2. Reports include:
   - Test results summary
   - Test execution timeline
   - Detailed error logs
   - Network request logs

## CI/CD Integration

Tests are automatically run in GitHub Actions:

1. On push to main branch
2. On pull requests to main branch
3. Test artifacts are stored for 30 days

## Directory Structure

```
e2e/
├── config/           # Test configuration
├── fixtures/         # Test data and utilities
└── *.e2e.ts         # Test files
```

## Troubleshooting

1. **DynamoDB Connection Issues**

   - Ensure local DynamoDB is running: `docker ps`
   - Check port 8000 is available

2. **API Key Issues**

   - Verify API key in environment file
   - Check API Gateway configuration

3. **Timeout Issues**
   - Adjust timeouts in `playwright.config.ts`
   - Consider network conditions

## Best Practices

1. **Test Organization**

   - One test file per feature
   - Use descriptive test names
   - Group related tests using `describe`

2. **Environment Handling**

   - Use environment-specific configurations
   - Never hardcode sensitive data
   - Use proper environment variables

3. **Test Data**
   - Clean up test data after tests
   - Use unique identifiers
   - Avoid test interdependencies
