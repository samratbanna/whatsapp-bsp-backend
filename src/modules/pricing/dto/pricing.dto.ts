import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePricingDto {
  // Base rates (Meta official — update when Meta changes)
  @ApiPropertyOptional({ example: 0.88 })
  @IsNumber() @IsOptional() @Min(0)
  marketingBase?: number;

  @ApiPropertyOptional({ example: 0.13 })
  @IsNumber() @IsOptional() @Min(0)
  utilityBase?: number;

  @ApiPropertyOptional({ example: 0.13 })
  @IsNumber() @IsOptional() @Min(0)
  authenticationBase?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber() @IsOptional() @Min(0)
  serviceBase?: number;

  // Your markup
  @ApiPropertyOptional({ example: 0.12 })
  @IsNumber() @IsOptional() @Min(0)
  marketingMarkup?: number;

  @ApiPropertyOptional({ example: 0.05 })
  @IsNumber() @IsOptional() @Min(0)
  utilityMarkup?: number;

  @ApiPropertyOptional({ example: 0.05 })
  @IsNumber() @IsOptional() @Min(0)
  authenticationMarkup?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber() @IsOptional() @Min(0)
  serviceMarkup?: number;
}

export class UpdatePlanPricingDto {
  @ApiPropertyOptional() @IsNumber() @IsOptional() @Min(0)
  marketingEffective?: number;

  @ApiPropertyOptional() @IsNumber() @IsOptional() @Min(0)
  utilityEffective?: number;

  @ApiPropertyOptional() @IsNumber() @IsOptional() @Min(0)
  authenticationEffective?: number;

  @ApiPropertyOptional() @IsNumber() @IsOptional() @Min(0)
  serviceEffective?: number;
}
