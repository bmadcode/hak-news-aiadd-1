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

  const createMockAxiosResponse = <T>(
    data: T,
    contentType: string,
  ): AxiosResponse<T> => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: { 'content-type': contentType },
    config: {
      url: 'https://example.com',
      headers: new AxiosHeaders(),
    } as InternalAxiosRequestConfig,
  });

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
      const mockUrl = 'https://example.com/article';
      jest.spyOn(httpService, 'get').mockImplementation(() => {
        return throwError(() => new Error('Network error'));
      });

      const result = await service.scrapeArticle(mockUrl);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch article: Network error');
      expect(result.text).toBe('');
      expect(result.fetchedAt).toBeDefined();
    });

    it('should handle invalid URLs', async () => {
      const mockUrl = 'not-a-url';

      const result = await service.scrapeArticle(mockUrl);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid URL provided');
      expect(result.text).toBe('');
      expect(result.fetchedAt).toBeDefined();
    });

    it('should handle non-HTML responses', async () => {
      const mockUrl = 'https://example.com/data.json';
      const mockResponse = createMockAxiosResponse(
        '{"key": "value"}',
        'application/json',
      );

      jest.spyOn(httpService, 'get').mockImplementation(() => {
        return of(mockResponse);
      });

      const result = await service.scrapeArticle(mockUrl);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Response is not HTML content');
      expect(result.text).toBe('');
      expect(result.fetchedAt).toBeDefined();
    });

    it('should respect rate limiting', async () => {
      const mockUrl = 'https://example.com/article';
      const mockHtmlResponse = createMockAxiosResponse(
        '<html><body><p>Test content</p></body></html>',
        'text/html',
      );

      jest.spyOn(httpService, 'get').mockImplementation(() => {
        return of(mockHtmlResponse);
      });

      // Make 11 concurrent requests
      const promises = Array(11)
        .fill(null)
        .map(() => service.scrapeArticle(mockUrl));

      const results = await Promise.all(promises);

      // Count successful requests and rate limited requests
      const successfulRequests = results.filter((r) => r.success).length;
      const rateLimitedRequests = results.filter(
        (r) => !r.success && r.error?.includes('Rate limit'),
      ).length;

      // Total should be 11
      expect(successfulRequests + rateLimitedRequests).toBe(11);
      // At least one request should be rate limited
      expect(rateLimitedRequests).toBeGreaterThan(0);
      // No more than 10 successful requests
      expect(successfulRequests).toBeLessThanOrEqual(10);
    });
  });
});
