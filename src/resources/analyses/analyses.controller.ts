import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiPaginationQuery } from 'src/decorators/pagination-query.decorator';
import { Pagination } from 'src/decorators/pagination.decorator';
import { JwtGuard } from 'src/guards/jwt.guard';
import { ResponseWordListCard } from '../wordlists/schemas/responses/wordlists';
import { AnalysesService } from './analyses.service';

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

  @Post('initiate/:id')
  public async initiateAnalysis(@Param('id') id: string) {
    return this.analysesService.initializeAnalysis(id);
  }

  @Post('stop/:id')
  public async stopAnalysis(@Param('id') id: string) {
    return this.analysesService.stopAnalysis(id);
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
  public async getAnalysisReports(@Pagination() pagination: PaginationParams) {
    return this.analysesService.getAnalysisReports(pagination);
  }

  @Get('reports/:id')
  public async getAnalysisReport(@Param('id') id: string) {
    return this.analysesService.getAnalysisReport(id);
  }
}
