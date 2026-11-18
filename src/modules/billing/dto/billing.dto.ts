import {
  IsDefined,
  IsEnum,
  IsIn,
  IsInt,
  IsMongoId,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '../schemas/order.schema';

const MAX_QTY = 10_000_000;

/** How many messages of each category to buy. At least one must be above zero. */
export class PurchaseQuantitiesDto {
  @ApiPropertyOptional({ example: 1000 })
  @IsInt()
  @Min(0)
  @Max(MAX_QTY)
  @IsOptional()
  transactional?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsInt()
  @Min(0)
  @Max(MAX_QTY)
  @IsOptional()
  promotional?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsInt()
  @Min(0)
  @Max(MAX_QTY)
  @IsOptional()
  authentication?: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: PurchaseQuantitiesDto })
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => PurchaseQuantitiesDto)
  items!: PurchaseQuantitiesDto;

  @ApiPropertyOptional({
    example: '9876543210',
    description:
      "Buyer phone for the gateway — required if the user's profile has none",
  })
  @IsOptional()
  @Matches(/^\+?[0-9]{8,15}$/, { message: 'phone must be 8-15 digits' })
  phone?: string;
}

/** A reseller's client buys from the balance its reseller loaded. */
export class BalancePurchaseDto {
  @ApiProperty({ type: PurchaseQuantitiesDto })
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => PurchaseQuantitiesDto)
  items!: PurchaseQuantitiesDto;

  @ApiPropertyOptional({
    description:
      'Any unique id per checkout (e.g. a UUID). Repeating it returns the first purchase instead of buying again.',
  })
  @IsOptional()
  @Matches(/^[A-Za-z0-9_-]{8,64}$/, {
    message: 'requestId must be 8-64 letters, digits, - or _',
  })
  requestId?: string;
}

export class PageQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}

export class OrderQueryDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}

export class AdminOrderQueryDto extends OrderQueryDto {
  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  orgId?: string;

  @ApiPropertyOptional({ enum: ['airpay', 'balance'] })
  @IsIn(['airpay', 'balance'])
  @IsOptional()
  gateway?: 'airpay' | 'balance';
}

export class SalesQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: 'Only this client' })
  @IsMongoId()
  @IsOptional()
  clientId?: string;
}

export class MarkPaidDto {
  @ApiProperty({ example: 'Confirmed on Airpay dashboard, txn 123456789' })
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  note!: string;

  @ApiPropertyOptional({ example: '123456789' })
  @IsString()
  @IsOptional()
  @MaxLength(60)
  gatewayTxnId?: string;
}
