import { ApiProperty } from '@nestjs/swagger';

export class ResponsePassphrase {
  @ApiProperty({ description: 'The decrypted passphrase' })
  passphrase: string;
}
