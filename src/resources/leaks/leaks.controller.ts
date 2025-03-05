import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Pagination } from 'src/decorators/pagination.decorator';
import { JwtGuard } from 'src/guards/jwt.guard';
import { ApiLeaksFilter } from 'src/utilities/LeaksFilter/swagger.decoration';
import { LeaksService } from './leaks.service';
import ResponseLeakResults, { ResponseLeak } from './schemas/responses/results';

@UseGuards(JwtGuard)
@ApiBearerAuth()
@Controller('leaks')
@ApiTags('Leaks')
export class LeaksController {
  public constructor(private readonly leaksService: LeaksService) {}

  @Get('news')
  @ApiOperation({ summary: 'Get latest data breaches' })
  @ApiResponse({ type: ResponseLeakResults })
  public async getNews() {
    return this.leaksService.getNews();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a data breach by ID',
  })
  @ApiResponse({ type: ResponseLeak })
  public async getLeakById(@Param('id') id: string) {
    return this.leaksService.getLeakById(id);
  }

  @Get()
  @ApiOperation({
    summary: 'Get data breaches with filtering, sorting and pagination',
  })
  @ApiLeaksFilter()
  @ApiResponse({ type: ResponseLeakResults })
  public async getLeaks(
    @Query() query: Record<string, string>,
    @Pagination() pagination: PaginationParams,
  ) {
    return this.leaksService.getLeaks(query, pagination);
  }
}
