import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiPaginationQuery } from 'src/decorators/pagination-query.decorator';
import { Pagination } from 'src/decorators/pagination.decorator';
import { JwtGuard } from 'src/guards/jwt.guard';
import { ResponseId } from 'src/utilities/Common/schemas/id';
import { ResponseWordListCard } from '../wordlists/schemas/responses/wordlists';
import { AnalysesService } from './analyses.service';
import {
  ResponseAnalysisReportDetails,
  ResponseAnalysisReportListItem,
} from './schemas/responses/analysesReport';

/**
 * Manage and monitor analysis process.
 * Only one analysis can be active at a time.
 */
@Controller('analyses')
@ApiTags('Analyses')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class AnalysesController {
  public constructor(private readonly analysesService: AnalysesService) {}

  @Post('initialize/:wordlistId')
  @ApiResponse({ type: ResponseId })
  @ApiOperation({ summary: 'Initialize a new analysis over a wordlist' })
  @ApiParam({ name: 'wordlistId', description: 'ID of the wordlist' })
  @HttpCode(HttpStatus.OK)
  public async initializeAnalysis(@Param('wordlistId') wordlistId: string) {
    return this.analysesService.initializeAnalysis(wordlistId);
  }

  @Post('stop/:analysisId')
  @ApiOperation({ summary: 'Stop an analysis' })
  @ApiParam({ name: 'analysisId', description: 'ID of the analysis to stop' })
  @HttpCode(HttpStatus.NO_CONTENT)
  public async stopAnalysis(@Param('analysisId') analysisId: string) {
    return this.analysesService.stopAnalysis(analysisId);
  }

  /**
   * Live stream of logs
   * In MVP we will be use polling to get the logs
   * In future we will be use websocket for better performance
   */
  @Get('observe/:id')
  public observe(@Param('id') id: string) {
    return this.analysesService.observeAnalysis(id);
  }

  @Get('available-wordlists')
  @ApiPaginationQuery()
  @ApiResponse({ type: [ResponseWordListCard] })
  public async getAvailableWordlists(
    @Pagination() pagination: PaginationParams,
  ) {
    return this.analysesService.getAvailableWordlists(pagination);
  }

  @Get('reports')
  @ApiPaginationQuery()
  @ApiResponse({ type: [ResponseAnalysisReportListItem] })
  public async getAnalysisReports(@Pagination() pagination: PaginationParams) {
    return this.analysesService.getAnalysisReports(pagination);
  }

  @Get('reports/:id')
  @ApiResponse({ type: ResponseAnalysisReportDetails })
  public async getAnalysisReport(@Param('id') id: string) {
    return this.analysesService.getAnalysisReport(id);
  }
}
