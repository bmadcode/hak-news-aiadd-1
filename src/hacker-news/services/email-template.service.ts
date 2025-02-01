import { Injectable } from '@nestjs/common';
import { render } from 'ejs';
import { SummarizedStoriesResponseDto } from '../dto/summarized-stories.dto';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class EmailTemplateService {
  private templatePath: string;

  constructor() {
    this.templatePath = path.join(__dirname, '../templates/email.template.ejs');
  }

  async generateEmailHtml(data: SummarizedStoriesResponseDto): Promise<string> {
    try {
      const template = await fs.readFile(this.templatePath, 'utf-8');
      const formattedDate = new Date().toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });

      return render(template, {
        stories: data.stories,
        meta: data.meta,
        date: formattedDate,
        helpers: {
          formatTime: (timestamp: number) => {
            return new Date(timestamp * 1000).toLocaleString();
          },
          formatScore: (score: number) => {
            return new Intl.NumberFormat('en-US').format(score);
          },
        },
      });
    } catch (error) {
      throw new Error(`Failed to generate email template: ${error.message}`);
    }
  }
}
