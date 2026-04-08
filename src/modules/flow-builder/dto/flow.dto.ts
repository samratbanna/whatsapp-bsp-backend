import {
  IsString, IsEnum, IsOptional, IsArray,
  IsObject, IsNumber, IsBoolean, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { FlowStatus } from '../schemas/flow.schema';

export class FlowTriggerDto {
  @ApiProperty({ enum: ['keyword', 'any_message', 'opt_in', 'button_reply'] })
  @IsString()
  type: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  caseSensitive?: boolean;
}

export class FlowNodeDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  type: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({ type: Object })
  @IsObject()
  @IsOptional()
  position?: { x: number; y: number };

  @ApiProperty({ type: Object })
  @IsObject()
  data: Record<string, any>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  next?: string;

  @ApiPropertyOptional({ type: [Object] })
  @IsArray()
  @IsOptional()
  branches?: { condition: string; next: string }[];
}

export class CreateFlowDto {
  @ApiProperty({ example: 'Welcome Bot' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ type: FlowTriggerDto })
  @ValidateNested()
  @Type(() => FlowTriggerDto)
  trigger: FlowTriggerDto;

  @ApiProperty({ type: [FlowNodeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FlowNodeDto)
  nodes: FlowNodeDto[];

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  wabaId?: string;
}

export class UpdateFlowDto extends PartialType(CreateFlowDto) {
  @ApiPropertyOptional({ enum: FlowStatus })
  @IsEnum(FlowStatus)
  @IsOptional()
  status?: FlowStatus;
}
