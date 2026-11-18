import {
  IsNumber, IsString, IsOptional,
  IsEnum, Min, Max, IsBoolean, IsInt, Matches, MaxLength,
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

// Super admin deducts credits from a category
export class DeductCreditsDto {
  @ApiProperty({ enum: WalletCategory, example: 'transactional' })
  @IsEnum(WalletCategory)
  category: WalletCategory;

  @ApiProperty({ example: 100, description: 'Number of message credits to deduct' })
  @IsInt()
  @Min(1)
  credits: number;

  @ApiPropertyOptional({ example: 'Manual correction — credits over-allocated' })
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

  // Validators are what keep these: the global ValidationPipe (whitelist) strips undecorated
  // properties, which silently pinned every page to 1.
  @ApiPropertyOptional({ default: 1 })
  @IsInt() @Min(1) @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 50 })
  @IsInt() @Min(1) @Max(200) @IsOptional()
  limit?: number;
}


// Partner server (e.g. Swaad Boss) loads credits its customer bought online.
export class PartnerTopupDto {
  @ApiProperty({ enum: WalletCategory, example: 'transactional' })
  @IsEnum(WalletCategory)
  category: WalletCategory;

  @ApiProperty({ example: 1000, description: 'Number of message credits to add' })
  @IsInt()
  @Min(1)
  @Max(10000000)
  credits: number;

  @ApiProperty({
    example: 'WA0MHZ3K1A9F3C2B7E:0',
    description: 'Idempotency key — the same reference is only ever credited once per organization',
  })
  @IsString()
  @Matches(/^[A-Za-z0-9:_-]{1,100}$/, { message: 'reference must be 1-100 letters, digits, ":", "_" or "-"' })
  reference: string;

  @ApiPropertyOptional({ example: 'Swaad Boss order WA0MHZ3K1A9F3C2B7E — 1000 utility messages' })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  description?: string;
}
