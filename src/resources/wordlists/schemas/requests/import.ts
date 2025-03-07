import { ApiProperty } from '@nestjs/swagger';
import { IsUrl } from 'class-validator';

export class RequestImportWordList {
  @IsUrl()
  @ApiProperty({
    description: 'The URL of the word list repository',
    example: 'https://github.com/username/wordlist-repository',
  })
  url: string;
}
