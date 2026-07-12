import {
  IsString, IsEnum, IsOptional, IsArray,
  IsObject, IsNumber, IsBoolean, ValidateNested, IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { FlowStatus } from '../schemas/flow.schema';

export class FlowTriggerDto {
  @ApiProperty({ enum: ['keyword', 'any_message', 'opt_in', 'button_reply'] })
  @IsString()
  type!: string;

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
  id!: string;

  @ApiProperty()
  @IsString()
  type!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({ type: Object })
  @IsObject()
  @IsOptional()
  position?: { x: number; y: number };

  @ApiPropertyOptional({ type: Object })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  next?: string;

  @ApiPropertyOptional({ type: [Object] })
  @IsArray()
  @IsOptional()
  branches?: { condition: string; next: string }[];

  // ReactFlow canvas metadata — stored for UI restore, ignored by executor
  @IsNumber()
  @IsOptional()
  width?: number;

  @IsNumber()
  @IsOptional()
  height?: number;

  @IsBoolean()
  @IsOptional()
  selected?: boolean;

  @IsBoolean()
  @IsOptional()
  dragging?: boolean;

  @IsObject()
  @IsOptional()
  positionAbsolute?: { x: number; y: number };
}

export class CreateFlowDto {
  @ApiProperty({ example: 'Welcome Bot' })
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ type: FlowTriggerDto })
  @ValidateNested()
  @Type(() => FlowTriggerDto)
  @IsOptional()
  trigger?: FlowTriggerDto;

  @ApiPropertyOptional({ type: [FlowNodeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FlowNodeDto)
  @IsOptional()
  nodes?: FlowNodeDto[];

  // ReactFlow edges — stored for canvas restore, not used by flow executor
  @ApiPropertyOptional({ type: [Object] })
  @IsArray()
  @IsOptional()
  edges?: Record<string, any>[];

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({ enum: ['once', 'cooldown', 'always'], default: 'once' })
  @IsIn(['once', 'cooldown', 'always'])
  @IsOptional()
  repeatPolicy?: 'once' | 'cooldown' | 'always';

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @IsOptional()
  cooldownDays?: number;

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
