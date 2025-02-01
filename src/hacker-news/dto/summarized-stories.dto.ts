import { IsInt, Min, Max, IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommentDto } from './top-stories.dto';

export class SummarizedStoriesRequestDto {
  @ApiProperty({
    description: 'Number of top stories to fetch and summarize (1-10)',
    minimum: 1,
    maximum: 10,
  })
  @IsInt()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  numStories: number;

  @ApiProperty({
    description: 'Number of comments to fetch and summarize per story (0-20)',
    minimum: 0,
    maximum: 20,
  })
  @IsInt()
  @Min(0)
  @Max(20)
  @Type(() => Number)
  numCommentsPerStory: number;

  @ApiProperty({
    description: 'Maximum length of article summary in words',
    minimum: 50,
    maximum: 500,
    default: 200,
  })
  @IsInt()
  @Min(50)
  @Max(500)
  @Type(() => Number)
  maxSummaryLength: number = 200;

  @ApiProperty({
    description: 'Whether to include original content alongside summaries',
    default: false,
  })
  @IsBoolean()
  @Type(() => Boolean)
  includeOriginalContent: boolean = false;
}

export class SummarizedContentDto {
  @ApiProperty()
  summary: string;

  @ApiProperty()
  summaryGeneratedAt: string;

  @ApiPropertyOptional()
  @IsOptional()
  originalContent?: string;

  @ApiProperty()
  tokenCount: number;
}

export class SummarizedStoryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  url?: string;

  @ApiProperty()
  score: number;

  @ApiProperty()
  by: string;

  @ApiProperty()
  time: number;

  @ApiProperty()
  descendants: number;

  @ApiProperty({ type: () => SummarizedContentDto })
  articleSummary: SummarizedContentDto;

  @ApiProperty({ type: () => SummarizedContentDto })
  commentsSummary: SummarizedContentDto;

  @ApiProperty({ type: [CommentDto] })
  comments: CommentDto[];
}

export class SummarizedStoriesResponseDto {
  @ApiProperty({ type: [SummarizedStoryDto] })
  stories: SummarizedStoryDto[];

  @ApiProperty()
  meta: {
    fetchedAt: string;
    processingTimeMs: number;
    storiesRetrieved: number;
    totalCommentsRetrieved: number;
    totalTokensUsed: number;
  };
}
