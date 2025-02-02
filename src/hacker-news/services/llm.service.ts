import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { createHash } from 'crypto';
import { AxiosError } from 'axios';

export interface SummarizedContent {
  summary: string;
  summaryGeneratedAt: string;
  tokenCount: number;
  originalContent?: string;
}

interface LLMChoice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}

interface LLMUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface LLMResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: LLMChoice[];
  usage: LLMUsage;
}

interface LocalLLMResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context: number[];
  total_duration: number;
  load_duration: number;
  prompt_eval_count: number;
  eval_count: number;
  eval_duration: number;
}

@Injectable()
export class LLMService {
  private readonly logger = new Logger(LLMService.name);
  private readonly apiKey: string;
  private readonly apiEndpoint: string;
  private readonly model: string;
  private readonly isLocalLLM: boolean;
  private readonly thinkingTag: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.apiKey = this.configService.getOrThrow<string>('LLM_API_KEY');
    this.apiEndpoint =
      this.configService.getOrThrow<string>('LLM_API_ENDPOINT');
    this.model = this.configService.getOrThrow<string>('LLM_MODEL');
    this.thinkingTag = this.configService.get<string>('LLM_THINKING_TAG', '');

    // Check if we're using a local LLM
    const baseUrl = this.configService.get<string>('LLM_BASE_URL', '');
    this.isLocalLLM =
      this.apiEndpoint.includes('localhost') ||
      this.apiEndpoint.includes('127.0.0.1') ||
      baseUrl.includes('localhost') ||
      baseUrl.includes('127.0.0.1');

    // Log configuration (without sensitive data)
    this.logger.log(
      `LLM Service initialized with endpoint: ${this.apiEndpoint}, model: ${
        this.model
      }, mode: ${this.isLocalLLM ? 'local' : 'remote'}`,
    );
  }

  /**
   * Removes thinking tags and their content from LLM output if thinking tag is configured
   */
  private removeThinkingTags(content: string): string {
    if (!this.thinkingTag) {
      return content;
    }

    const thinkRegex = new RegExp(
      `<${this.thinkingTag}>.*?</${this.thinkingTag}>`,
      'gs',
    );
    return content.replace(thinkRegex, '').trim();
  }

  async summarizeContent(
    content: string,
    maxLength: number,
    includeOriginal = false,
  ): Promise<SummarizedContent> {
    try {
      const contentHash = createHash('sha256')
        .update(content + maxLength + includeOriginal)
        .digest('hex');
      const cacheKey = `summary-${contentHash}`;

      this.logger.debug(
        `Attempting to summarize content of length ${content.length}`,
      );
      this.logger.debug(`Content preview: ${content.substring(0, 100)}...`);

      const cachedSummary =
        await this.cacheManager.get<SummarizedContent>(cacheKey);
      if (cachedSummary) {
        this.logger.debug('Returning cached summary');
        return cachedSummary;
      }

      const prompt = `Please provide a concise summary of the following content in ${maxLength} words or less:\n\n${content}`;

      this.logger.debug(
        `Making request to ${
          this.isLocalLLM ? 'local' : 'remote'
        } LLM API with ${content.length} characters of content`,
      );

      let response;
      if (this.isLocalLLM) {
        // Ollama format
        const requestPayload = {
          model: this.model,
          prompt,
          stream: false,
          options: {
            temperature: 0.3,
            num_predict: maxLength * 10,
          },
        };

        this.logger.debug(
          `Local LLM request payload: ${JSON.stringify(requestPayload, null, 2)}`,
        );

        response = await firstValueFrom(
          this.httpService.post<LocalLLMResponse>(
            this.apiEndpoint,
            requestPayload,
            {
              headers: {
                'Content-Type': 'application/json',
              },
              timeout: 30000,
            },
          ),
        );

        this.logger.debug(`Response status: ${response.status}`);
        this.logger.debug(
          `Response data: ${JSON.stringify(response.data, null, 2)}`,
        );

        if (!response.data.response) {
          throw new Error(
            `Invalid response format: ${JSON.stringify(response.data)}`,
          );
        }

        const filteredResponse = this.removeThinkingTags(
          response.data.response,
        );

        const summary: SummarizedContent = {
          summary: filteredResponse.trim(),
          summaryGeneratedAt: new Date().toISOString(),
          tokenCount:
            response.data.prompt_eval_count + response.data.eval_count,
          ...(includeOriginal && { originalContent: content }),
        };

        await this.cacheManager.set(cacheKey, summary, 24 * 60 * 60 * 1000);
        return summary;
      } else {
        // Remote LLM format (DeepSeek)
        const requestPayload = {
          model: this.model,
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful assistant that provides concise summaries.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: maxLength * 2,
          temperature: 0.3,
        };

        this.logger.debug(
          `Remote LLM request payload: ${JSON.stringify(
            requestPayload,
            null,
            2,
          )}`,
        );

        response = await firstValueFrom(
          this.httpService.post<LLMResponse>(this.apiEndpoint, requestPayload, {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          }),
        );

        this.logger.debug(`Response status: ${response.status}`);
        this.logger.debug(
          `Response data: ${JSON.stringify(response.data, null, 2)}`,
        );

        if (!response.data.choices?.[0]?.message?.content) {
          throw new Error(
            `Invalid response format: ${JSON.stringify(response.data)}`,
          );
        }

        const filteredResponse = this.removeThinkingTags(
          response.data.choices[0].message.content,
        );

        const summary: SummarizedContent = {
          summary: filteredResponse.trim(),
          summaryGeneratedAt: new Date().toISOString(),
          tokenCount: response.data.usage.total_tokens,
          ...(includeOriginal && { originalContent: content }),
        };

        await this.cacheManager.set(cacheKey, summary, 24 * 60 * 60 * 1000);
        return summary;
      }
    } catch (error) {
      this.logger.error(
        `Failed to summarize content: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );

      if (error instanceof AxiosError) {
        this.logger.error(
          `API Error Response: ${JSON.stringify(error.response?.data)}`,
        );
        this.logger.error(`API Error Config: ${JSON.stringify(error.config)}`);
      }

      throw new Error('Failed to generate content summary');
    }
  }
}
