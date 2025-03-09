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
    nullable: true,
  })
  @IsString()
  @IsOptional()
  note: string | null;

  @ApiProperty({
    description:
      'Unless provided, icon.horse api will be used to generate a random icon',
    example: 'https://example.com/icon.png',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  icon: string | null;
}
export default RequestCreateAccount;
