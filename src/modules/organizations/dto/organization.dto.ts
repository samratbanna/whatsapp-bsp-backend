import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  MinLength,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { OrgStatus } from '../../../common/enums';

class InvoiceBusinessDetailsDto {
  @ApiPropertyOptional({ example: 'Acme Private Limited' })
  @IsString()
  @IsOptional()
  legalBusinessName?: string;

  @ApiPropertyOptional({ example: 'Acme' })
  @IsString()
  @IsOptional()
  tradeName?: string;

  @ApiPropertyOptional({ example: '29ABCDE1234F1Z5' })
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
    { message: 'Invalid GSTIN format' })
  gstin?: string;

  @ApiPropertyOptional({ example: 'ABCDE1234F' })
  @IsString()
  @IsOptional()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/, { message: 'Invalid PAN format' })
  pan?: string;

  @ApiPropertyOptional({ example: 'U12345MH2020PTC123456' })
  @IsString()
  @IsOptional()
  cin?: string;

  @ApiPropertyOptional({ example: 'UDYAM-RJ-01-0000001' })
  @IsString()
  @IsOptional()
  udyamNumber?: string;

  @ApiPropertyOptional({ example: '22, Bapu Nagar' })
  @IsString()
  @IsOptional()
  addressLine1?: string;

  @ApiPropertyOptional({ example: 'Near City Mall' })
  @IsString()
  @IsOptional()
  addressLine2?: string;

  @ApiPropertyOptional({ example: 'Jaipur' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Rajasthan' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: '302015' })
  @IsString()
  @IsOptional()
  @Matches(/^\d{6}$/, { message: 'Invalid PIN code format' })
  pinCode?: string;

  @ApiPropertyOptional({ example: 'India' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: 'billing@acme.com' })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'Acme Private Limited' })
  @IsString()
  @IsOptional()
  bankAccountName?: string;

  @ApiPropertyOptional({ example: '123456789012' })
  @IsString()
  @IsOptional()
  bankAccountNumber?: string;

  @ApiPropertyOptional({ example: 'HDFC Bank' })
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiPropertyOptional({ example: 'HDFC0001234' })
  @IsString()
  @IsOptional()
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: 'Invalid IFSC format' })
  ifscCode?: string;

  @ApiPropertyOptional({ example: 'Jaipur Main Branch' })
  @IsString()
  @IsOptional()
  bankBranch?: string;
}

class LoginUserDetailsDto {
  @ApiPropertyOptional({ example: '662e8d31fc13ae5f86000123' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ example: 'Samrat Singh' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'samrat@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+919999999999' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'Founder' })
  @IsString()
  @IsOptional()
  designation?: string;
}

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ example: 'acme-corp' })
  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug can only contain lowercase letters, numbers and hyphens',
  })
  slug?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  billingEmail?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'India' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: 'Asia/Kolkata' })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ type: InvoiceBusinessDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => InvoiceBusinessDetailsDto)
  businessDetails?: InvoiceBusinessDetailsDto;

  @ApiPropertyOptional({ type: LoginUserDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LoginUserDetailsDto)
  loginUserDetails?: LoginUserDetailsDto;

  @ApiPropertyOptional({ example: 'Acme Admin' })
  @IsString()
  @IsOptional()
  ownerName?: string;

  @ApiPropertyOptional({ example: 'admin@acme.com' })
  @IsEmail()
  @IsOptional()
  ownerEmail?: string;

  @ApiPropertyOptional({ example: 'Password@123' })
  @IsString()
  @IsOptional()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Admin password must contain uppercase, lowercase and a number',
  })
  ownerPassword?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contact?: string;
}

export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {
  @ApiPropertyOptional({ enum: OrgStatus })
  @IsEnum(OrgStatus)
  @IsOptional()
  status?: OrgStatus;
}

