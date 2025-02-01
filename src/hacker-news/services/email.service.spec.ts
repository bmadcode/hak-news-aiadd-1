import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailTemplateService } from './email-template.service';
import { SummarizedStoriesResponseDto } from '../dto/summarized-stories.dto';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;
  let emailTemplateService: EmailTemplateService;
  let mockTransporter: jest.Mocked<nodemailer.Transporter>;

  const mockConfig: Record<string, string | number> = {
    SMTP_HOST: 'smtp.gmail.com',
    SMTP_PORT: 587,
    SMTP_USER: 'test@gmail.com',
    SMTP_PASS: 'test-password',
  };

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
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue(true),
      verify: jest.fn().mockResolvedValue(true),
    } as any;

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => mockConfig[key]),
          },
        },
        {
          provide: EmailTemplateService,
          useValue: {
            generateEmailHtml: jest.fn().mockResolvedValue('<html>Test</html>'),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
    emailTemplateService =
      module.get<EmailTemplateService>(EmailTemplateService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendNewsletterEmail', () => {
    const recipients = ['test@example.com'];

    it('should send email successfully', async () => {
      await service.sendNewsletterEmail(recipients, mockData);

      expect(emailTemplateService.generateEmailHtml).toHaveBeenCalledWith(
        mockData,
      );
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: mockConfig.SMTP_USER,
          to: recipients,
          html: '<html>Test</html>',
        }),
      );
    });

    it('should throw error when email sending fails', async () => {
      mockTransporter.sendMail.mockRejectedValueOnce(
        new Error('Failed to send'),
      );

      await expect(
        service.sendNewsletterEmail(recipients, mockData),
      ).rejects.toThrow('Failed to send newsletter email: Failed to send');
    });
  });

  describe('verifyConnection', () => {
    it('should return true when connection is verified', async () => {
      const result = await service.verifyConnection();
      expect(result).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should return false when connection verification fails', async () => {
      mockTransporter.verify.mockRejectedValueOnce(
        new Error('Connection failed'),
      );

      const result = await service.verifyConnection();
      expect(result).toBe(false);
    });
  });
});
