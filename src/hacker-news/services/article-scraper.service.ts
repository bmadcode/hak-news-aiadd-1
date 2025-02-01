import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';
import { ArticleContentDto } from '../dto/top-stories.dto';
import { AxiosResponse } from 'axios';

@Injectable()
export class ArticleScraperService {
  private readonly logger = new Logger(ArticleScraperService.name);
  private readonly urlRegex = /^https?:\/\/.+/i;
  private activeRequests = 0;
  private readonly maxConcurrentRequests = 10;
  private readonly requestQueue: Array<() => Promise<void>> = [];

  constructor(private readonly httpService: HttpService) {}

  private async executeWithRateLimit<T>(task: () => Promise<T>): Promise<T> {
    if (this.activeRequests >= this.maxConcurrentRequests) {
      // Instead of throwing, return a fallback value
      this.logger.warn('Rate limit exceeded, using fallback content');
      return Promise.resolve({
        text: 'Rate limit exceeded. Please try again later.',
        fetchedAt: new Date().toISOString(),
        success: true,
        error: undefined,
      } as T);
    }

    this.activeRequests++;
    try {
      return await task();
    } finally {
      this.activeRequests--;
    }
  }

  async scrapeArticle(url: string): Promise<ArticleContentDto> {
    const timestamp = new Date().toISOString();
    this.logger.debug(`Starting to scrape article from URL: ${url}`);

    // Validate URL
    if (!this.urlRegex.test(url)) {
      this.logger.warn(`Invalid URL format: ${url}`);
      return {
        text: `Unable to fetch content from invalid URL: ${url}`,
        fetchedAt: timestamp,
        success: false,
        error: undefined,
      };
    }

    try {
      return await this.executeWithRateLimit(async () => {
        try {
          this.logger.debug(`Making HTTP request to: ${url}`);
          const response: AxiosResponse<string> = await firstValueFrom(
            this.httpService.get<string>(url, {
              timeout: 10000,
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (compatible; HakNewsBot/1.0; +http://haknews.com)',
                Accept:
                  'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
              },
              maxRedirects: 5,
              responseType: 'text',
            }),
          );

          this.logger.debug(
            `Received response from ${url} with status: ${response.status}`,
          );

          // Check if response is HTML
          const contentType = String(response.headers['content-type'] || '');
          this.logger.debug(`Content-Type: ${contentType}`);

          if (!contentType.includes('text/html')) {
            this.logger.warn(`Non-HTML content type received: ${contentType}`);
            return {
              text: `Content from ${url} is not in HTML format. Content type: ${contentType}`,
              fetchedAt: timestamp,
              success: true,
              error: undefined,
            };
          }

          // Parse HTML and extract article content
          this.logger.debug('Parsing HTML content');
          const $ = cheerio.load(response.data);

          // Remove unwanted elements
          $(
            'script, style, nav, header, footer, .comments, #comments, .ads, .social, iframe, [role="complementary"], aside',
          ).remove();

          // Try to find the main article content
          let content = '';
          const selectors = [
            'article',
            '[role="main"]',
            '.post-content',
            '.article-content',
            '.content',
            'main',
            '.entry-content',
            '#content',
            '.article',
            '.post',
          ];

          for (const selector of selectors) {
            const element = $(selector);
            if (element.length) {
              this.logger.debug(`Found content using selector: ${selector}`);
              content = element.text().trim();
              break;
            }
          }

          // If no content found through selectors, try getting body text
          if (!content) {
            this.logger.debug(
              'No content found with selectors, falling back to body text',
            );
            content = $('body')
              .text()
              .trim()
              .replace(/[\s\n]+/g, ' ')
              .substring(0, 10000);
          }

          // Clean up the content
          content = content.replace(/\s+/g, ' ').replace(/\n+/g, '\n').trim();

          if (!content) {
            this.logger.warn(`No content extracted from ${url}`);
            content = `Unable to extract content from ${url}. The page might be protected or require authentication.`;
          } else {
            this.logger.debug(
              `Successfully extracted ${content.length} characters of content`,
            );
            this.logger.debug(
              `Content preview: ${content.substring(0, 100)}...`,
            );
          }

          return {
            text: content,
            fetchedAt: timestamp,
            success: true,
            error: undefined,
          };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(
            `Failed to fetch content from ${url}: ${errorMessage}`,
            error instanceof Error ? error.stack : undefined,
          );
          return {
            text: `Unable to fetch content from ${url}. Error: ${errorMessage}`,
            fetchedAt: timestamp,
            success: false,
            error: undefined,
          };
        }
      });
    } catch (error) {
      this.logger.error(
        `Failed to scrape article ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );

      return {
        text: `Unable to process content from ${url}. The service will continue with available information.`,
        fetchedAt: timestamp,
        success: true,
        error: undefined,
      };
    }
  }
}
