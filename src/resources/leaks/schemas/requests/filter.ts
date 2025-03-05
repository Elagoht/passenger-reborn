import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum SortField {
  NAME = 'name',
  TITLE = 'title',
  DOMAIN = 'domain',
  DATE = 'date',
  PWN_COUNT = 'pwnCount',
  VERIFIED = 'verified',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class LeakFilterDto {
  @ApiProperty({
    required: false,
    description: 'Filter by breach name (fuzzy search)',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by breach title (fuzzy search)',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by breach domain (fuzzy search)',
  })
  @IsString()
  @IsOptional()
  domain?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by breach date (from)',
    type: Date,
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  date?: Date;

  @ApiProperty({
    required: false,
    description: 'Filter by breach date (to)',
    type: Date,
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dateTo?: Date;

  @ApiProperty({
    required: false,
    description: 'Filter by minimum affected accounts',
    type: Number,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  pwnCount?: number;

  @ApiProperty({
    required: false,
    description: 'Filter by maximum affected accounts',
    type: Number,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  pwnCountTo?: number;

  @ApiProperty({
    required: false,
    description: 'Filter by verification status',
    type: Boolean,
  })
  @IsBoolean()
  @Transform(({ value }): boolean => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  @IsOptional()
  verified?: boolean;

  @ApiProperty({
    required: false,
    enum: SortField,
    description: 'Sort field',
  })
  @IsEnum(SortField)
  @IsOptional()
  sortBy?: SortField;

  @ApiProperty({
    required: false,
    enum: SortOrder,
    description: 'Sort order',
  })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder = SortOrder.ASC;
}
