import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
export class RequestSetPreference {
  @ApiProperty({
    description: 'The value of the preference',
    example: 'true',
  })
  @IsString()
  @IsNotEmpty()
  value: string;
}
