import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

class RequestCreateAccount {
  @ApiProperty({
    example: 'https://example.com',
  })
  @IsString()
  @IsNotEmpty()
  platform: string;

  @ApiProperty({
    example: 'my-super-secret-password',
  })
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
