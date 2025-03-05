import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Pagination } from 'src/decorators/pagination.decorator';
import { JwtGuard } from 'src/guards/jwt.guard';
import { LeaksService } from './leaks.service';
import { LeakFilterDto } from './schemas/requests/filter';
import ResponseLeakResults, { ResponseLeak } from './schemas/responses/results';

@UseGuards(JwtGuard)
@ApiBearerAuth()
@Controller('leaks')
@ApiTags('Leaks')
export class LeaksController {
  public constructor(private readonly leaksService: LeaksService) {}

  @Get('news')
  @ApiOperation({ summary: 'Get latest data breaches' })
  @ApiResponse({ type: [ResponseLeak] })
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
  @ApiResponse({ type: ResponseLeakResults })
  public async getLeaks(
    @Query() filterDto: LeakFilterDto,
    @Pagination() pagination: PaginationParams,
  ) {
    return this.leaksService.getLeaks(filterDto, pagination);
  }
}
