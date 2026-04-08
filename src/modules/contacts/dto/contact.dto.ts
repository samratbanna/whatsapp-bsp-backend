import {
  IsString, IsEmail, IsOptional, IsBoolean,
  IsArray, IsObject, IsPhoneNumber, Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateContactDto {
  @ApiProperty({ example: '919876543210', description: 'Phone without + prefix' })
  @IsString()
  @Matches(/^\d{7,15}$/, { message: 'Phone must be 7-15 digits without + prefix' })
  phone: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ type: [String], description: 'Group IDs' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  groups?: string[];

  @ApiPropertyOptional({ type: Object })
  @IsObject()
  @IsOptional()
  customFields?: Record<string, string>;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  labels?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateContactDto extends PartialType(CreateContactDto) {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  optedOut?: boolean;
}

export class BulkImportDto {
  @ApiProperty({
    type: [CreateContactDto],
    description: 'Array of contacts to import',
  })
  @IsArray()
  contacts: CreateContactDto[];
}

export class ContactQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  groupId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  optedOut?: boolean;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 50 })
  limit?: number;
}

export class CreateGroupDto {
  @ApiProperty({ example: 'VIP Customers' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}
