import { ApiProperty } from '@nestjs/swagger';
import { AnalysisStatus } from '@prisma/client';
import { ResponseAccountCardItem } from 'src/resources/accounts/schemas/responses/accounts';

export class ResponseAnalysisReportListItem {
  @ApiProperty({ description: 'The ID of the analysis report' })
  id: string;

  @ApiProperty({
    enum: AnalysisStatus,
    description: 'The status of the analysis report',
  })
  status: AnalysisStatus;

  @ApiProperty({
    description: 'The message of the analysis report',
    nullable: true,
  })
  message: string | null;

  @ApiProperty({ description: 'The total matched of the analysis report' })
  totalMatched: number;

  @ApiProperty({ description: 'The total checked of the analysis report' })
  totalChecked: number;

  @ApiProperty({ description: 'The took miliseconds of the analysis report' })
  tookMiliseconds: number;

  @ApiProperty({ description: 'The created at date of the analysis report' })
  createdAt: Date;

  @ApiProperty({ description: 'The updated at date of the analysis report' })
  updatedAt: Date;

  @ApiProperty({ description: 'The word list of the analysis report' })
  wordList: AnalysisReportWordList;
}

class AnalysisReportWordList {
  @ApiProperty({ description: 'The ID of the word list' })
  id: string;

  @ApiProperty({ description: 'The display name of the word list' })
  displayName: string;
}

export class ResponseAnalysisReportDetails extends ResponseAnalysisReportListItem {
  @ApiProperty({ description: 'The matched accounts of the analysis report' })
  matchedAccounts: ResponseAccountCardItem[];
}
