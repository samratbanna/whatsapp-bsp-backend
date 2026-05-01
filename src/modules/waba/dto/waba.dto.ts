import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WabaOwnershipType } from '../schemas/waba.schema';

export class ConnectWabaDto {
  @ApiProperty({ description: 'WhatsApp Business Account ID from Meta' })
  @IsString()
  wabaId: string;

  @ApiProperty({ description: 'Phone Number ID from Meta dashboard' })
  @IsString()
  phoneNumberId: string;

  @ApiProperty({ description: 'Permanent system user access token' })
  @IsString()
  accessToken: string;

  @ApiProperty({ description: 'Meta App ID used to exchange the token' })
  @IsString()
  appId: string;

  @ApiProperty({ description: 'Meta App Secret used to exchange the token' })
  @IsString()
  appSecret: string;

  @ApiPropertyOptional({ enum: WabaOwnershipType, default: WabaOwnershipType.BYO })
  @IsEnum(WabaOwnershipType)
  @IsOptional()
  ownershipType?: WabaOwnershipType;

  @ApiPropertyOptional({ description: 'Friendly label e.g. Support Number' })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  poolLabel?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ default: true, description: 'Deduct wallet for messages (auto-true for SHARED, false for BYO)' })
  @IsBoolean()
  @IsOptional()
  walletBillingEnabled?: boolean;
}

export class UpdateWabaDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  accessToken?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  walletBillingEnabled?: boolean;
}

// Super admin: assign a BSP-owned (SHARED) WABA to an org
export class AssignSharedWabaDto {
  @ApiProperty({ description: 'Organization ID to assign this WABA to' })
  @IsString()
  orgId: string;

  @ApiProperty({ description: 'WABA ID from BSP Meta account' })
  @IsString()
  wabaId: string;

  @ApiProperty({ description: 'Phone Number ID' })
  @IsString()
  phoneNumberId: string;

  @ApiProperty({ description: 'BSP system user access token' })
  @IsString()
  accessToken: string;

  @ApiProperty({ description: 'Meta App ID used to exchange the token' })
  @IsString()
  appId: string;

  @ApiProperty({ description: 'Meta App Secret used to exchange the token' })
  @IsString()
  appSecret: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  poolLabel?: string;
}
