import {
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '../schemas/order.schema';

export class CreateOrderDto {
  @ApiProperty({ example: 'starter', description: 'Plan slug or id' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  plan!: string;

  @ApiPropertyOptional({
    example: '9876543210',
    description:
      "Buyer phone for the gateway — required if the user's profile has none",
  })
  @IsOptional()
  @Matches(/^\+?[0-9]{8,15}$/, { message: 'phone must be 8-15 digits' })
  phone?: string;
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
