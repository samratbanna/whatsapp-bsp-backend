import {
  IsString, IsEnum, IsArray, IsOptional,
  ValidateNested, IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateCategory } from '../schemas/template.schema';

export class TemplateButtonDto {
  @IsString() type: string;
  @IsString() text: string;
  @IsOptional() @IsString() url?: string;
  @IsOptional() @IsString() phone_number?: string;
}

export class TemplateComponentDto {
  @ApiProperty({ enum: ['HEADER', 'BODY', 'FOOTER', 'BUTTONS'] })
  @IsString()
  type: string;

  @ApiPropertyOptional({ enum: ['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'] })
  @IsString()
  @IsOptional()
  format?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  text?: string;

  @ApiPropertyOptional({ type: [TemplateButtonDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateButtonDto)
  @IsOptional()
  buttons?: TemplateButtonDto[];

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  example?: any;
}

export class CreateTemplateDto {
  @ApiProperty({ example: 'order_confirmation' })
  @IsString()
  name: string;

  @ApiProperty({ enum: TemplateCategory })
  @IsEnum(TemplateCategory)
  category: TemplateCategory;

  @ApiProperty({ example: 'en_US' })
  @IsString()
  language: string;

  @ApiProperty({ type: [TemplateComponentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateComponentDto)
  components: TemplateComponentDto[];

  @ApiPropertyOptional({ description: 'WABA ID (uses default if omitted)' })
  @IsString()
  @IsOptional()
  wabaId?: string;
}

export class TemplateQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  wabaId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;
}
