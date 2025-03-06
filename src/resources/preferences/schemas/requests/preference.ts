import { ApiProperty } from '@nestjs/swagger';

export class RequestSetPreference {
  @ApiProperty({
    description: 'The value of the preference',
    example: 'true',
  })
  value: string;
}
