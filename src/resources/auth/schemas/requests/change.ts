import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsMasterPassphrase } from 'src/decorators/validation';

export class RequestChangePassphrase {
  @IsString()
  @IsNotEmpty()
  @IsMasterPassphrase()
  @ApiProperty({
    description: 'The new passphrase for the user',
    example: 'new-passphrase',
  })
  passphrase: string;
}
