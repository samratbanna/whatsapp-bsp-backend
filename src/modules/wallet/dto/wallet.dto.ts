import {
  IsNumber, IsString, IsOptional,
  IsEnum, Min, IsBoolean, IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WalletCategory, TransactionReason } from '../schemas/wallet.schema';

// Super admin adds credits to a category
export class AddCreditsDto {
  @ApiProperty({ enum: WalletCategory, example: 'transactional' })
  @IsEnum(WalletCategory)
  category: WalletCategory;

  @ApiProperty({ example: 1000, description: 'Number of message credits to add' })
  @IsInt()
  @Min(1)
  credits: number;

  @ApiProperty({ enum: TransactionReason, example: 'admin_topup' })
  @IsEnum(TransactionReason)
  reason: TransactionReason;

  @ApiPropertyOptional({ example: 'Client paid ₹500 cash — adding 1000 transactional' })
  @IsString()
  @IsOptional()
  description?: string;
}

// Super admin bulk add across all categories at once
export class BulkAddCreditsDto {
  @ApiPropertyOptional({ example: 1000 })
  @IsInt() @Min(0) @IsOptional()
  transactional?: number;

  @ApiPropertyOptional({ example: 1000 })
  @IsInt() @Min(0) @IsOptional()
  promotional?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsInt() @Min(0) @IsOptional()
  authentication?: number;

  @ApiPropertyOptional({ example: 'Monthly recharge — cash received' })
  @IsString() @IsOptional()
  description?: string;
}

export class UpdateWalletSettingsDto {
  @ApiPropertyOptional({ example: 100 })
  @IsInt() @IsOptional() @Min(0)
  lowTransactionalThreshold?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsInt() @IsOptional() @Min(0)
  lowPromotionalThreshold?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsInt() @IsOptional() @Min(0)
  lowAuthenticationThreshold?: number;

  @ApiPropertyOptional()
  @IsBoolean() @IsOptional()
  blockOnEmpty?: boolean;
}

export class WalletTxQueryDto {
  @ApiPropertyOptional({ enum: WalletCategory })
  @IsEnum(WalletCategory) @IsOptional()
  category?: WalletCategory;

  @ApiPropertyOptional({ enum: TransactionReason })
  @IsEnum(TransactionReason) @IsOptional()
  reason?: TransactionReason;

  @ApiPropertyOptional()
  @IsString() @IsOptional()
  from?: string;

  @ApiPropertyOptional()
  @IsString() @IsOptional()
  to?: string;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 50 })
  limit?: number;
}

