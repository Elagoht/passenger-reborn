import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsUrlWithPort } from 'src/decorators/is-url-with-ports.decorator';

class RequestCreateAccount {
  @ApiProperty({ example: 'Example' })
  @IsString()
  @IsNotEmpty()
  platform: string;

  @ApiProperty({ example: 'hello@example.com' })
  @IsString()
  @IsNotEmpty()
  identity: string;

  @ApiProperty({ example: 'https://example.com' })
  @IsUrlWithPort()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ example: 'my-super-secret-password' })
  @IsString()
  @IsNotEmpty()
  passphrase: string;

  @ApiProperty({
    example: 'People do not know that domain has a login feature!',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  note: string | null;

  @ApiProperty({
    description: 'Array from tag ids to add to the account',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    nullable: true,
  })
  @IsArray()
  @IsOptional()
  tags: string[] | null;
}

export default RequestCreateAccount;
