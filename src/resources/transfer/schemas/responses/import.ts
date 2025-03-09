import { ApiProperty } from '@nestjs/swagger';

export class ImportResponseSuccess {
  @ApiProperty({
    description: 'The message of the result',
    example: 'Import successful',
  })
  message: string;

  @ApiProperty({
    description: 'The details of the result, may include errors',
    example: '10 accounts imported',
  })
  details: string;
}

export class ImportResponseConflict {
  @ApiProperty({
    description: 'The message of the result',
    example: 'Conflicting accounts',
  })
  message: string;

  @ApiProperty({
    description: 'The details of the result, may include errors',
    example:
      '[Line 173]: example, http://example.com\n[Line 471]: example, http://example.com',
  })
  details: string;
}
