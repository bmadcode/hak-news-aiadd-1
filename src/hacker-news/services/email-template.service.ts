import { Injectable } from '@nestjs/common';
import { render } from 'ejs';
import { SummarizedStoriesResponseDto } from '../dto/summarized-stories.dto';

const EMAIL_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .story-title {
            text-align: center;
            font-weight: bold;
            margin: 20px 0;
            font-size: 1.2em;
        }
        .divider {
            text-align: center;
            margin: 20px 0;
            color: #666;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            color: #666;
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
        a {
            color: #2c3e50;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        .summary-label {
            font-weight: bold;
            margin-bottom: 5px;
            color: #2c3e50;
        }
        .summary-content {
            margin-left: 0;
            margin-bottom: 15px;
            line-height: 1.6;
        }
        .meta {
            font-size: 0.9em;
            color: #666;
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <h1 style="text-align: center; color: #2c3e50;">Daily Hacker News Top Summary</h1>
    <p style="text-align: center; color: #666;">from BMad for <%= date %></p>

    <% stories.forEach((story, index) => { %>
        <div class="story-title">Story <%= index + 1 %></div>
        <p><a href="<%= story.url %>"><%= story.title %></a></p>
        
        <div class="summary-label">Story Summary:</div>
        <div class="summary-content"><%= story.articleSummary.summary %></div>
        
        <div class="summary-label">Comment Summary:</div>
        <div class="summary-content"><%= story.commentsSummary.summary %></div>
        
        <div class="meta">
            <span>Score: <%= story.score %></span> |
            <span>Comments: <%= story.descendants %></span> |
            <span>By: <%= story.by %></span>
        </div>
        
        <div class="divider">***</div>
    <% }); %>

    <div class="footer">
        <p>Thank you for subscribing to the BMad Hacker News Summary</p>
        <p>- Brian BMad Madison</p>
        <p>You can unsubscribe at any time by clicking the link below</p>
        <p><a href="http://localhost:3000/subscriptions?email=<%= locals.email %>&type=hakdaily" style="color: #666;">Unsubscribe</a></p>
    </div>
</body>
</html>`;

@Injectable()
export class EmailTemplateService {
  async generateEmailHtml(data: SummarizedStoriesResponseDto): Promise<string> {
    try {
      const formattedDate = new Date().toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });

      return render(EMAIL_TEMPLATE, {
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
