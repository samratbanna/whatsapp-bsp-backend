import {
  IsString, IsEnum, IsOptional, IsArray,
  IsObject, IsNumber, IsDateString, Min, Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CampaignType } from '../schemas/campaign.schema';

export class CreateCampaignDto {
  @ApiProperty({ example: 'Diwali Offers 2024' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ enum: CampaignType })
  @IsEnum(CampaignType)
  @IsOptional()
  type?: CampaignType;

  @ApiProperty({ description: 'Template ID' })
  @IsString()
  templateId: string;

  @ApiProperty({ example: 'en_US', default: 'en_US' })
  @IsString()
  templateLanguage: string;

  @ApiPropertyOptional({
    type: Object,
    example: { '1': 'Customer', '2': '20% OFF' },
    description: 'Static values. Use {{contact.name}} or {{contact.phone}} for dynamic.',
  })
  @IsObject()
  @IsOptional()
  templateVariables?: Record<string, string>;

  @ApiPropertyOptional({ type: [String], description: 'Contact IDs' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  contacts?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Contact Group IDs' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  groups?: string[];

  @ApiPropertyOptional({ description: 'ISO date string for scheduled campaigns' })
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 80 })
  @IsNumber()
  @Min(1)
  @Max(80)
  @IsOptional()
  messagesPerSecond?: number;

  @ApiPropertyOptional({ description: 'WABA ID (uses default if omitted)' })
  @IsString()
  @IsOptional()
  wabaId?: string;
}

export class UpdateCampaignDto extends PartialType(CreateCampaignDto) {}

export class CampaignQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  limit?: number;
}
