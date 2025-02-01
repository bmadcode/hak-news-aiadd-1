import { Test, TestingModule } from '@nestjs/testing';
import { ArticleScraperService } from './article-scraper.service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { of, throwError } from 'rxjs';
import {
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosHeaders,
  RawAxiosRequestHeaders,
} from 'axios';

describe('ArticleScraperService', () => {
  let service: ArticleScraperService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule,
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        CacheModule.register(),
      ],
      providers: [ArticleScraperService],
    }).compile();

    service = module.get<ArticleScraperService>(ArticleScraperService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('scrapeArticle', () => {
    const mockUrl = 'https://example.com/article';
    const mockHtml = `
      <html>
        <body>
          <article>
            <h1>Test Article</h1>
            <p>This is the article content.</p>
            <div class="comments">This should not be included</div>
          </article>
        </body>
      </html>
    `;

    const createMockHeaders = (
      contentType?: string,
    ): RawAxiosRequestHeaders => {
      const headers: RawAxiosRequestHeaders = {};
      if (contentType) {
        headers['content-type'] = contentType;
      }
      return headers;
    };

    it('should successfully scrape article content', async () => {
      const mockResponse: AxiosResponse<string> = {
        data: mockHtml,
        status: 200,
        statusText: 'OK',
        headers: createMockHeaders('text/html'),
        config: {
          url: mockUrl,
          headers: new AxiosHeaders(),
        } as InternalAxiosRequestConfig,
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      const result = await service.scrapeArticle(mockUrl);

      expect(result.success).toBe(true);
      expect(result.text).toContain('This is the article content');
      expect(result.text).not.toContain('This should not be included');
      expect(result.fetchedAt).toBeDefined();
      expect(new Date(result.fetchedAt).getTime()).toBeLessThanOrEqual(
        Date.now(),
      );
    });

    it('should handle network errors gracefully', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(throwError(() => new Error('Network error')));

      const result = await service.scrapeArticle(mockUrl);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch article: Network error');
      expect(result.text).toBe('');
      expect(result.fetchedAt).toBeDefined();
    });

    it('should handle invalid URLs', async () => {
      const result = await service.scrapeArticle('not-a-url');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid URL provided');
      expect(result.text).toBe('');
      expect(result.fetchedAt).toBeDefined();
    });

    it('should handle non-HTML responses', async () => {
      const mockResponse: AxiosResponse<unknown> = {
        data: { some: 'json' },
        status: 200,
        statusText: 'OK',
        headers: createMockHeaders('application/json'),
        config: {
          url: mockUrl,
          headers: new AxiosHeaders(),
        } as InternalAxiosRequestConfig,
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      const result = await service.scrapeArticle(mockUrl);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Response is not HTML content');
      expect(result.text).toBe('');
      expect(result.fetchedAt).toBeDefined();
    });

    it('should respect rate limiting', async () => {
      const mockResponse: AxiosResponse<string> = {
        data: mockHtml,
        status: 200,
        statusText: 'OK',
        headers: createMockHeaders('text/html'),
        config: {
          url: mockUrl,
          headers: new AxiosHeaders(),
        } as InternalAxiosRequestConfig,
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      // Make 11 concurrent requests (more than our limit of 10)
      const promises = Array(11)
        .fill(null)
        .map(() => service.scrapeArticle(mockUrl));

      const results = await Promise.all(promises);
      const successfulRequests = results.filter((r) => r.success).length;

      expect(successfulRequests).toBeLessThanOrEqual(10);
    });
  });
});
