import { IsString, IsArray, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'Production Key' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['messages:send', 'contacts:read'],
  })
  @IsArray()
  @IsOptional()
  scopes?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['192.168.1.1', '10.0.0.0/8'],
  })
  @IsArray()
  @IsOptional()
  allowedIps?: string[];

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
