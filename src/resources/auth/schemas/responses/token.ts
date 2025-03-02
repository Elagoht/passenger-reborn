import { ApiProperty } from '@nestjs/swagger';

class ResponseToken {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1Ni...',
  })
  token: string;
}

export default ResponseToken;
