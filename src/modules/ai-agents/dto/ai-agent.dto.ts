import {
  IsString, IsEnum, IsOptional, IsArray,
  IsNumber, IsBoolean, Min, Max, IsMongoId,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { AiProvider } from '../schemas/ai-agent.schema';

export class CreateAiAgentDto {
  @ApiProperty({ example: 'Support Bot' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Handles customer support queries' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'WABA ID — assign as default agent for this WABA' })
  @IsMongoId()
  @IsOptional()
  wabaId?: string;

  // ── Provider config ────────────────────────────────────────────────
  @ApiProperty({ enum: AiProvider, example: AiProvider.OPENAI })
  @IsEnum(AiProvider)
  provider: AiProvider;

  @ApiProperty({ example: 'gpt-4o' })
  @IsString()
  model: string;

  @ApiProperty({ example: 'sk-...' })
  @IsString()
  apiKey: string;

  // ── Personality ────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: 'You are a helpful customer support agent for Paathshala.' })
  @IsString()
  @IsOptional()
  systemPrompt?: string;

  @ApiPropertyOptional({ type: [String], example: ['Never mention competitor names', 'Always greet users warmly'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hardRules?: string[];

  // ── Response config ────────────────────────────────────────────────
  @ApiPropertyOptional({ minimum: 0, maximum: 1, default: 0.7 })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  temperature?: number;

  @ApiPropertyOptional({ default: 500 })
  @IsNumber()
  @Min(50)
  @Max(4000)
  @IsOptional()
  maxTokens?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  maxHistoryTurns?: number;

  // ── Human Handoff ──────────────────────────────────────────────────
  @ApiPropertyOptional({ default: 50, description: 'Max AI replies before handing off to human' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxTurnsBeforeHandoff?: number;

  @ApiPropertyOptional({ type: [String], example: ['human', 'agent', 'support'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  handoffKeywords?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  handoffMessage?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  cantAnswerMessage?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 1, default: 0.65 })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  confidenceThreshold?: number;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  showCitations?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateAiAgentDto extends PartialType(CreateAiAgentDto) {}

export class SetDefaultAgentDto {
  @ApiProperty({ description: 'WABA ID to assign this agent as default' })
  @IsMongoId()
  wabaId: string;
}

export class TestQueryDto {
  @ApiProperty({ example: 'What is the price of Paathshala?' })
  @IsString()
  query: string;
}
