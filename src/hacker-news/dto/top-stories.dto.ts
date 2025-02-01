import { IsInt, Min, Max, IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Add type safety for decorators
import type { ValidationOptions } from 'class-validator';
const validationMetadata: ValidationOptions = {};

export class TopStoriesRequestDto {
  @ApiProperty({
    description: 'Number of top stories to fetch (1-30)',
    minimum: 1,
    maximum: 30,
  })
  @IsInt()
  @Min(1)
  @Max(30)
  @Type(() => Number)
  numStories: number;

  @ApiProperty({
    description: 'Number of comments to fetch per story (0-50)',
    minimum: 0,
    maximum: 50,
  })
  @IsInt()
  @Min(0)
  @Max(50)
  @Type(() => Number)
  numCommentsPerStory: number;

  @ApiProperty({
    description: 'Whether to include full article content',
    default: false,
  })
  @IsBoolean()
  @Type(() => Boolean)
  includeArticleContent: boolean = false;
}

export class ArticleContentDto {
  @ApiProperty()
  text: string;

  @ApiProperty()
  fetchedAt: string;

  @ApiProperty()
  success: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  error?: string;
}

export class CommentDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  text: string;

  @ApiProperty()
  by: string;

  @ApiProperty()
  time: number;

  @ApiProperty()
  level: number;

  @ApiPropertyOptional()
  @IsOptional()
  parent?: number;
}

export class StoryDto {
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

  @ApiPropertyOptional({ type: () => ArticleContentDto })
  @IsOptional()
  articleContent?: ArticleContentDto;

  @ApiProperty({ type: [CommentDto] })
  comments: CommentDto[];
}

export class TopStoriesResponseDto {
  @ApiProperty({ type: [StoryDto] })
  stories: StoryDto[];

  @ApiProperty()
  meta: {
    fetchedAt: string;
    processingTimeMs: number;
    storiesRetrieved: number;
    totalCommentsRetrieved: number;
  };
}
