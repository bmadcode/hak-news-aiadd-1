import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SummarizedStoriesResponseDto } from '../dto/summarized-stories.dto';
import { EmailTemplateService } from './email-template.service';

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly emailTemplateService: EmailTemplateService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('SMTP_HOST'),
      port: this.configService.getOrThrow<number>('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.getOrThrow<string>('SMTP_USER'),
        pass: this.configService.getOrThrow<string>('SMTP_PASS'),
      },
    });
  }

  async sendNewsletterEmail(
    recipients: string[],
    data: SummarizedStoriesResponseDto,
  ): Promise<void> {
    try {
      const htmlContent =
        await this.emailTemplateService.generateEmailHtml(data);

      const mailOptions: nodemailer.SendMailOptions = {
        from: this.configService.getOrThrow<string>('SMTP_USER'),
        to: recipients,
        subject: `Hacker News Daily Digest - ${new Date().toLocaleDateString()}`,
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Successfully sent newsletter to ${recipients.length} recipients`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send newsletter email: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to send newsletter email: ${error.message}`);
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to verify email connection: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }
}
