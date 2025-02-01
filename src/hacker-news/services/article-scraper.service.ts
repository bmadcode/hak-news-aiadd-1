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
      throw new Error('Rate limit exceeded');
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

    // Validate URL
    if (!this.urlRegex.test(url)) {
      return {
        text: '',
        fetchedAt: timestamp,
        success: false,
        error: 'Invalid URL provided',
      };
    }

    try {
      return await this.executeWithRateLimit(async () => {
        const response: AxiosResponse<string> = await firstValueFrom(
          this.httpService.get<string>(url, {
            timeout: 10000, // 10 second timeout
            headers: {
              'User-Agent':
                'Mozilla/5.0 (compatible; HakNewsBot/1.0; +http://haknews.com)',
            },
            responseType: 'text',
          }),
        );

        // Check if response is HTML
        const contentType = String(response.headers['content-type'] || '');
        if (!contentType.includes('text/html')) {
          return {
            text: '',
            fetchedAt: timestamp,
            success: false,
            error: 'Response is not HTML content',
          };
        }

        // Parse HTML and extract article content
        const $ = cheerio.load(response.data);

        // Remove unwanted elements
        $(
          'script, style, nav, header, footer, .comments, #comments, .ads, .social, iframe',
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
        ];

        for (const selector of selectors) {
          const element = $(selector);
          if (element.length) {
            content = element.text().trim();
            break;
          }
        }

        // If no content found through selectors, try getting body text
        if (!content) {
          content = $('body')
            .text()
            .trim()
            .replace(/[\s\n]+/g, ' ')
            .substring(0, 10000); // Limit content length
        }

        return {
          text: content || 'No content extracted',
          fetchedAt: timestamp,
          success: !!content,
          error: content ? undefined : 'Failed to extract article content',
        };
      });
    } catch (error) {
      this.logger.warn(
        `Failed to scrape article ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      return {
        text: '',
        fetchedAt: timestamp,
        success: false,
        error: `Failed to fetch article: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
