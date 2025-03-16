import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
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
