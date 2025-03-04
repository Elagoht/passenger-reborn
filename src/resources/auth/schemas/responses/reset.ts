import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class ResponseResetPassphrase {
  @ApiProperty({
    description: 'The new passphrase assigned to the user',
    example: 'new-passphrase',
  })
  @IsNotEmpty()
  assignedPassphrase: string;
}
