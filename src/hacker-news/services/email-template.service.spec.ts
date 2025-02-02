import { Test, TestingModule } from '@nestjs/testing';
import { EmailTemplateService } from './email-template.service';
import { SummarizedStoriesResponseDto } from '../dto/summarized-stories.dto';

describe('EmailTemplateService', () => {
  let service: EmailTemplateService;

  const mockData: SummarizedStoriesResponseDto = {
    stories: [
      {
        id: 1,
        title: 'Test Story',
        url: 'https://test.com',
        score: 100,
        by: 'tester',
        time: 1234567890,
        descendants: 50,
        articleSummary: {
          summary: 'Test article summary',
          summaryGeneratedAt: '2024-03-20T12:00:00Z',
          tokenCount: 100,
        },
        commentsSummary: {
          summary: 'Test comments summary',
          summaryGeneratedAt: '2024-03-20T12:00:00Z',
          tokenCount: 50,
        },
      },
    ],
    meta: {
      fetchedAt: '2024-03-20T12:00:00Z',
      processingTimeMs: 1000,
      storiesRetrieved: 1,
      totalCommentsRetrieved: 50,
      totalTokensUsed: 150,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailTemplateService],
    }).compile();

    service = module.get<EmailTemplateService>(EmailTemplateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateEmailHtml', () => {
    it('should generate HTML from template with provided data', async () => {
      const result = await service.generateEmailHtml(mockData);

      expect(result).toContain('Daily Hacker News Top Summary');
      expect(result).toContain('from BMad for');
      expect(result).toContain('Story 1');
      expect(result).toContain('Test Story');
      expect(result).toContain('Test article summary');
      expect(result).toContain('Test comments summary');
      expect(result).toContain(
        'Thank you for subscribing to the BMad Hacker News Summary',
      );
    });
  });
});
