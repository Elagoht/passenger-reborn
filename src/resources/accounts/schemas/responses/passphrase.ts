import { ApiProperty } from '@nestjs/swagger';

export class ResponsePassphrase {
  @ApiProperty({ description: 'The decrypted passphrase' })
  passphrase: string;

  @ApiProperty({ description: 'The number of times the passphrase was copied' })
  copiedCount: number;
}
