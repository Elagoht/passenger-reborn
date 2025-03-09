import { ApiProperty } from '@nestjs/swagger';

export enum ExportFormat {
  FIREFOX = 'firefox',
  CHROME = 'chrome',
  LASTPASS = 'lastpass',
  ONEPASSWORD = '1password',
}

export class ExportRequest {
  @ApiProperty({
    enum: ExportFormat,
    description: 'Format to export data to',
    example: ExportFormat.CHROME,
    required: true,
  })
  format: ExportFormat;
}
