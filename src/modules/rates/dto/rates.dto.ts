import {
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

const MAX_RATE_PAISE = 10_000; // ₹100 per message — anything above is a typo

/**
 * Paise per message (13 = ₹0.13), up to two decimals. Leave a field out to keep it as it is;
 * send null to clear it (a direct customer then falls back to the default rate).
 */
export class RatesDto {
  @ApiPropertyOptional({ example: 13, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(MAX_RATE_PAISE)
  transactional?: number | null;

  @ApiPropertyOptional({ example: 85, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(MAX_RATE_PAISE)
  promotional?: number | null;

  @ApiPropertyOptional({ example: 13, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(MAX_RATE_PAISE)
  authentication?: number | null;
}

export class UpdateRateSettingsDto {
  @ApiPropertyOptional({ type: RatesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RatesDto)
  defaultRates?: RatesDto;

  @ApiPropertyOptional({ example: 18 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(50)
  gstPercent?: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'Smallest online purchase in ₹, before GST',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(1_000_000)
  minPurchase?: number;
}
