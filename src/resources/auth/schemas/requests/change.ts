import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RequestChangePassphrase {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The new passphrase for the user',
    example: 'new-passphrase',
  })
  passphrase: string;
}
