import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { IsMasterPassphrase } from 'src/utilities/Decorators/validation';

class RequestInitialize {
  @ApiProperty({
    example: 'passphrase',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(16)
  @MaxLength(128)
  @IsMasterPassphrase()
  passphrase: string;
}

export default RequestInitialize;
