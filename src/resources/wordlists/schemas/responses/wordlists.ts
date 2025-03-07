import { ApiProperty } from '@nestjs/swagger';
import { WordlistStatus } from '@prisma/client';

export class ResponseWordListCard {
  @ApiProperty({ description: 'The ID of the word list' })
  id: string;

  @ApiProperty({ description: 'The name of the word list' })
  displayName: string;

  @ApiProperty({ description: 'The description of the word list' })
  description: string;

  @ApiProperty({
    description: 'The status of the word list',
    enum: WordlistStatus,
  })
  status: WordlistStatus;

  @ApiProperty({
    description: 'The total number of passwords in the word list',
  })
  totalPasswords: number;

  @ApiProperty({ description: 'The year of the word list' })
  year: number;

  @ApiProperty({ description: 'The size of the word list' })
  size: string;
}

export class ResponseWordList extends ResponseWordListCard {
  @ApiProperty({ description: 'The minimum length of the word list' })
  minLength: number;

  @ApiProperty({ description: 'The maximum length of the word list' })
  maxLength: number;

  @ApiProperty({ description: 'The total number of files in the word list' })
  totalFiles: number;

  @ApiProperty({ description: 'The path of the word list' })
  path: string;

  @ApiProperty({ description: 'The repository URL of the word list' })
  repositoryUrl: string;

  @ApiProperty({ description: 'The source URL of the word list' })
  sourceUrl: string;

  @ApiProperty({ description: 'The published by of the word list' })
  publishedBy: string;

  @ApiProperty({ description: 'The adapted by of the word list' })
  adaptedBy: string;

  @ApiProperty({ description: 'The message of the word list' })
  message: string;

  @ApiProperty({ description: 'The count of analyses of the word list' })
  analysesCount: number;
}
