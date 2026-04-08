import {
  IsString, IsEnum, IsOptional, IsObject,
  IsArray, ValidateNested, IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '../schemas/message.schema';

export class SendTextDto {
  @ApiProperty({ example: '919876543210' })
  @IsString()
  to: string;

  @ApiProperty({ example: 'Hello from BSP!' })
  @IsString()
  text: string;

  @ApiPropertyOptional({ description: 'WABA ID to use (uses default if omitted)' })
  @IsString()
  @IsOptional()
  wabaId?: string;
}

export class TemplateComponentParameter {
  @ApiProperty({ enum: ['text', 'image', 'video', 'document', 'payload'] })
  @IsString()
  type: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  text?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  image?: { link: string };

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  document?: { link: string; filename?: string };
}

export class TemplateComponent {
  @ApiProperty({ enum: ['header', 'body', 'button'] })
  @IsString()
  type: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sub_type?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  index?: number;

  @ApiPropertyOptional({ type: [TemplateComponentParameter] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateComponentParameter)
  @IsOptional()
  parameters?: TemplateComponentParameter[];
}

export class SendTemplateDto {
  @ApiProperty({ example: '919876543210' })
  @IsString()
  to: string;

  @ApiProperty({ example: 'order_confirmation' })
  @IsString()
  templateName: string;

  @ApiProperty({ example: 'en_US' })
  @IsString()
  languageCode: string;

  @ApiPropertyOptional({
    example: 'MARKETING',
    description: 'Template category — used for wallet billing',
    enum: ['MARKETING', 'UTILITY', 'AUTHENTICATION', 'SERVICE'],
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ type: [TemplateComponent] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateComponent)
  @IsOptional()
  components?: TemplateComponent[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  wabaId?: string;
}

export class SendMediaDto {
  @ApiProperty({ example: '919876543210' })
  @IsString()
  to: string;

  @ApiProperty({ enum: [MessageType.IMAGE, MessageType.VIDEO, MessageType.AUDIO, MessageType.DOCUMENT] })
  @IsEnum(MessageType)
  type: MessageType;

  @ApiProperty({ example: 'https://example.com/file.pdf' })
  @IsString()
  mediaUrl: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  caption?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  filename?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  wabaId?: string;
}

export class MessageQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string; // filter by contact phone

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  wabaId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 50 })
  @IsNumber()
  @IsOptional()
  limit?: number;
}
