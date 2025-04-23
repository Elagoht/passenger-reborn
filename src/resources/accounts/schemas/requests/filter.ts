import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class RequestFilterAccounts {
  @ApiProperty({
    name: 'search',
    example: 'Example',
    required: false,
    description: 'Joint search by platform, identity, or url',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    name: 'platform',
    example: 'Example',
    required: false,
    description: 'Filter by platform name',
  })
  @IsString()
  @IsOptional()
  platform?: string;

  @ApiProperty({
    name: 'identity',
    example: 'hello@example.com',
    required: false,
    description: 'Filter by identity',
  })
  @IsString()
  @IsOptional()
  identity?: string;

  @ApiProperty({
    name: 'url',
    example: 'https://example.com',
    required: false,
    description: 'Filter by URL',
  })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiProperty({
    name: 'tags',
    description: 'Array of tag ids to filter by',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @Type(() => String)
  tags?: string[];
}

export default RequestFilterAccounts;
