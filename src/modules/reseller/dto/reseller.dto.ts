import {
  IsEmail,
  IsNumber,
  IsEnum,
  IsInt,
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
import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { CreateOrganizationDto } from '../../organizations/dto/organization.dto';
import { WalletCategory } from '../../wallet/schemas/wallet.schema';
import { OrgStatus } from '../../../common/enums';
import { RatesDto } from '../../rates/dto/rates.dto';

const MAX_TRANSFER = 10_000_000;
const MAX_BALANCE = 10_000_000; // ₹1 crore per entry

export class InitialCreditsDto {
  @ApiPropertyOptional({ example: 1000 })
  @IsInt()
  @Min(0)
  @Max(MAX_TRANSFER)
  @IsOptional()
  transactional?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsInt()
  @Min(0)
  @Max(MAX_TRANSFER)
  @IsOptional()
  promotional?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsInt()
  @Min(0)
  @Max(MAX_TRANSFER)
  @IsOptional()
  authentication?: number;
}

/** A reseller onboards a client: the client organization plus its admin login. */
export class CreateClientDto extends OmitType(CreateOrganizationDto, [
  'slug',
  'ownerEmail',
  'ownerPassword',
  'loginUserDetails',
] as const) {
  @ApiProperty({
    example: 'owner@client.com',
    description: "Client admin's login email",
  })
  @IsEmail()
  ownerEmail!: string;

  @ApiProperty({
    example: 'Password@123',
    description: "Client admin's initial password",
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase and a number',
  })
  ownerPassword!: string;

  @ApiPropertyOptional({
    type: InitialCreditsDto,
    description:
      "Credits to move from the reseller's wallet to the new client right away",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => InitialCreditsDto)
  initialCredits?: InitialCreditsDto;

  @ApiPropertyOptional({
    type: RatesDto,
    description:
      'What the client pays per message (paise). A category without a rate cannot be bought.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RatesDto)
  rates?: RatesDto;

  @ApiPropertyOptional({
    example: 1000,
    description: 'Money (₹) to load on the client balance right away',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_BALANCE)
  openingBalance?: number;
}

export class UpdateClientDto extends PartialType(
  OmitType(CreateOrganizationDto, [
    'slug',
    'ownerName',
    'ownerEmail',
    'ownerPassword',
    'loginUserDetails',
    'contact',
  ] as const),
) {}

export class TransferCreditsDto {
  @ApiProperty({ enum: WalletCategory, example: 'transactional' })
  @IsEnum(WalletCategory)
  category!: WalletCategory;

  @ApiProperty({ example: 1000 })
  @IsInt()
  @Min(1)
  @Max(MAX_TRANSFER)
  credits!: number;

  @ApiPropertyOptional({ example: 'Paid ₹2,000 via UPI on 18 Nov' })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  note?: string;
}

export class BalanceChangeDto {
  @ApiProperty({ example: 1000, description: 'Amount in ₹ (up to 2 decimals)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(MAX_BALANCE)
  amount!: number;

  @ApiPropertyOptional({ example: 'Received ₹1,000 via UPI' })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  note?: string;
}

export class ClientListQueryDto {
  @ApiPropertyOptional({ enum: OrgStatus })
  @IsEnum(OrgStatus)
  @IsOptional()
  status?: OrgStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

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
