import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RequestResetPassphrase {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The recovery key for the user',
    example: 'recovery-key',
  })
  recoveryKey: string;
}
