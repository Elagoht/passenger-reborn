import { ApiProperty } from '@nestjs/swagger';
import { IsUrl } from 'class-validator';

export class RequestImportWordList {
  @IsUrl()
  @ApiProperty({
    description: 'The raw metadata.json URL of the word list repository',
    example:
      'https://raw.githubusercontent.com/Elagoht/passenger-wordlist-rockyou-2009/refs/heads/main/metadata.json',
  })
  url: string;
}
