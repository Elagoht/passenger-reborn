import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

class RequestLogin {
  @ApiProperty({
    example: 'passphrase',
  })
  @IsNotEmpty()
  @IsString()
  passphrase: string;
}

export default RequestLogin;
