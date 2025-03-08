import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

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
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ example: 'my-super-secret-password' })
  @IsString()
  @IsNotEmpty()
  passphrase: string;

  @ApiProperty({
    example: 'People do not know that domain has a login feature!',
  })
  @IsString()
  @IsOptional()
  note: string;

  @ApiProperty({
    description:
      'Unless provided, icon.horse api will be used to generate a random icon',
    example: 'https://example.com/icon.png',
  })
  @IsString()
  @IsOptional()
  icon: string;
}
export default RequestCreateAccount;
