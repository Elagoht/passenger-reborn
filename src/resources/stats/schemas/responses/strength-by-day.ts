import { ApiProperty } from '@nestjs/swagger';

export class ResponseStrengthGraphEntry {
  @ApiProperty({
    description: 'Date in YYYY-MM-DD format',
    example: '2024-01-01',
  })
  date: string;

  @ApiProperty({
    description: 'Average strength of passphrases (0-100)',
    example: 75,
  })
  strength: number;
}
