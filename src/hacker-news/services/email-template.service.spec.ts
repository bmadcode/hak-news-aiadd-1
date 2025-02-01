import { Test, TestingModule } from '@nestjs/testing';
import { EmailTemplateService } from './email-template.service';
import { SummarizedStoriesResponseDto } from '../dto/summarized-stories.dto';
import * as fs from 'fs/promises';
import * as path from 'path';

jest.mock('fs/promises');
jest.mock('path');

describe('EmailTemplateService', () => {
  let service: EmailTemplateService;
  const mockTemplate = `
    <!DOCTYPE html>
    <html>
      <body>
        <p>This is the Daily Hacker News Top Summary from BMad for <%= date %></p>
        <% stories.forEach((story, index) => { %>
          <div class="story-title">Story <%= index + 1 %></div>
          <p><a href="<%= story.url %>"><%= story.title %></a></p>
          <p>Story <%= index + 1 %> Summary: <%= story.articleSummary.summary %></p>
          <p>Story <%= index + 1 %> Comment Summary: <%= story.commentsSummary.summary %></p>
          <div class="divider">***</div>
        <% }); %>
        <div class="footer">
          <p>Thank you for subscribing to the BMad Hacker News Summary</p>
          <p>- Brian BMad Madison</p>
          <p>You can unsubscribe at any time by clicking the link below</p>
          <p><a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">Unsubscribe</a></p>
        </div>
      </body>
    </html>
  `;

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

    // Mock path.join to return a fixed path
    (path.join as jest.Mock).mockReturnValue('/mock/path/to/template.ejs');

    // Mock fs.readFile to return our mock template
    (fs.readFile as jest.Mock).mockResolvedValue(mockTemplate);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateEmailHtml', () => {
    it('should generate HTML from template with provided data', async () => {
      const result = await service.generateEmailHtml(mockData);

      expect(result).toContain(
        'This is the Daily Hacker News Top Summary from BMad for',
      );
      expect(result).toContain('Story 1');
      expect(result).toContain('Test Story');
      expect(result).toContain('Test article summary');
      expect(result).toContain('Test comments summary');
      expect(result).toContain(
        'Thank you for subscribing to the BMad Hacker News Summary',
      );
      expect(result).toContain('- Brian BMad Madison');
      expect(result).toContain('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/); // Should contain formatted date
    });

    it('should throw error when template file cannot be read', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

      await expect(service.generateEmailHtml(mockData)).rejects.toThrow(
        'Failed to generate email template: File not found',
      );
    });
  });
});
