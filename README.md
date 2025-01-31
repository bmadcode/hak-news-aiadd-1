# HakNews Summarizer

A sophisticated service that delivers AI-powered summaries of Hacker News stories and discussions.

## Table of Contents

- [HakNews Summarizer](#haknews-summarizer)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Features](#features)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
  - [Testing](#testing)
  - [API Documentation](#api-documentation)
  - [Tech Stack](#tech-stack)
    - [Backend](#backend)
    - [Testing Framework](#testing-framework)
    - [Infrastructure (AWS)](#infrastructure-aws)
    - [Additional Tools](#additional-tools)
  - [Technologies Used](#technologies-used)
  - [Contributing](#contributing)
  - [License](#license)
  - [Acknowledgments](#acknowledgments)

## Overview

HakNews Summarizer is a sophisticated service that delivers daily summaries of top Hacker News stories and their discussions. It leverages AI to provide concise, meaningful summaries of both articles and community discussions, making it easier to stay informed about the tech world's most engaging conversations.

## Features

- 🔍 Retrieves top stories from Hacker News API
- 📝 AI-powered summarization of articles and comments
- 📧 Email delivery of daily summaries
- 🔐 Secure API access with API key authentication
- 🚀 Serverless architecture using AWS services

## Getting Started

### Prerequisites

- Node.js 22
- AWS Account (Free Tier compatible)
- Gmail account for email service
- AWS CLI configured locally

### Installation

1. Clone the repository:

   ```bash
   git clone [repository-url]
   cd haknews
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables:

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. Start the development server:
   ```bash
   npm run start:dev
   ```

## Testing

Run different types of tests:

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## API Documentation

The API provides the following main endpoints:

- `GET /api/stories` - Retrieve top Hacker News stories
- `POST /api/summarize` - Get AI-summarized stories and comments
- Additional documentation available in the API documentation

## Tech Stack

### Backend

- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe development
- **Node.js 22** - JavaScript runtime
- **AWS SDK V3** - AWS service integration

### Testing Framework

- **Jest** - Unit testing framework
- **Playwright** - End-to-end testing

### Infrastructure (AWS)

- **CDK** - Infrastructure as Code
- **Lambda** - Serverless compute
- **DynamoDB** - NoSQL database
- **API Gateway** - API management
- **CloudWatch** - Monitoring and logging
- **SQS** - Message queuing

### Additional Tools

- **Zod** - Schema validation
- **Deepseek R1** - LLM for content summarization
- **Nodemailer** - Email service integration

## Technologies Used

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js_22-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![AWS](https://img.shields.io/badge/AWS-232F3E?style=flat&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![Jest](https://img.shields.io/badge/Jest-C21325?style=flat&logo=jest&logoColor=white)](https://jestjs.io/)
[![Playwright](https://img.shields.io/badge/Playwright-45ba4b?style=flat&logo=playwright&logoColor=white)](https://playwright.dev/)

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Hacker News API](https://github.com/HackerNews/API)
- [NestJS Documentation](https://docs.nestjs.com/)
- The amazing open-source community

---

_"Efficiency is essential for success." - Lt. Commander Data_
