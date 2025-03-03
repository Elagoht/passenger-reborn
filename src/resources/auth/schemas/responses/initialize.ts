import { ApiProperty } from '@nestjs/swagger';

class ResponseInitialize {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1Ni...',
  })
  token: string;

  @ApiProperty({
    description: 'DO NOT LOST, WILL NOT BE SHOWN AGAIN',
  })
  recoveryKey: string;
}

export default ResponseInitialize;
