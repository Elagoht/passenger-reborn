import { ApiProperty } from '@nestjs/swagger';
import { WordlistStatus } from '@prisma/client';

export class ResponseWordListStatus {
  @ApiProperty({
    description: 'The status of the word list',
    enum: WordlistStatus,
  })
  status: WordlistStatus;

  @ApiProperty({ description: 'The message of the word list' })
  message: string;
}
