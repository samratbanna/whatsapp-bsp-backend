import {
  IsString, IsOptional, IsEnum, IsBoolean, IsNumber,
  IsArray, IsUrl, ValidateNested, Min, Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { KnowledgeType } from '../schemas/ai-knowledge.schema';

export class CrawlerConfigDto {
  @IsOptional() @IsNumber() @Min(1) @Max(500) maxPages?: number;
  @IsOptional() @IsNumber() @Min(1) @Max(10) maxDepth?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) includePaths?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) excludePaths?: string[];
  @IsOptional() @IsBoolean() followSitemap?: boolean;
  @IsOptional() @IsBoolean() respectRobotsTxt?: boolean;
}

export class QaPairDto {
  @IsString() question: string;
  @IsString() answer: string;
}

export class ProductDto {
  @IsString() name: string;
  @IsOptional() @IsString() price?: string;
  @IsOptional() @IsString() description?: string;
  [key: string]: any;
}

export class CreateKnowledgeTextDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsString() text: string;
  @IsOptional() @IsString() language?: string;
}

export class CreateKnowledgeUrlDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsString() @IsUrl() url: string;
  @IsOptional() @IsString() language?: string;
}

export class CreateKnowledgeCrawlerDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsString() @IsUrl() startUrl: string;
  @IsOptional() @ValidateNested() @Type(() => CrawlerConfigDto) config?: CrawlerConfigDto;
  @IsOptional() @IsBoolean() autoSync?: boolean;
  @IsOptional() @IsEnum(['1d', '7d', '30d', 'manual']) syncInterval?: string;
  @IsOptional() @IsString() language?: string;
}

export class CreateKnowledgeYoutubeDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsString() youtubeUrl: string;
  @IsOptional() @IsString() language?: string;
}

export class CreateKnowledgeQaPairsDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => QaPairDto) pairs: QaPairDto[];
}

export class CreateKnowledgeRulesDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsArray() @IsString({ each: true }) rules: string[];
}

export class CreateKnowledgeProductCatalogDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => ProductDto) products: ProductDto[];
}

export class UpdateKnowledgeDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() autoSync?: boolean;
  @IsOptional() @IsEnum(['1d', '7d', '30d', 'manual']) syncInterval?: string;
}

export class RetriggerProcessingDto {
  @IsOptional() @ValidateNested() @Type(() => CrawlerConfigDto) config?: CrawlerConfigDto;
}
