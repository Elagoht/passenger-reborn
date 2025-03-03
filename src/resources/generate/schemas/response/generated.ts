import { ApiProperty } from '@nestjs/swagger';

class GeneratedResponse {
  @ApiProperty({
    description: 'The generated passphrase',
  })
  passphrase: string;
}

export default GeneratedResponse;
