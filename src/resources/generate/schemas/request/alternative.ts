import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AlternativeRequest {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The input string to generate an alternative from',
    example: 'you can still read this',
  })
  input: string;
}

export default AlternativeRequest;
