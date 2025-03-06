import { ApiProperty } from '@nestjs/swagger';

export class ResponsePreference {
  @ApiProperty({
    description: 'The key of the preference',
    example: 'strictMode',
  })
  key: string;

  @ApiProperty({
    description: 'The value of the preference',
    example: 'true',
  })
  value: string;
}
