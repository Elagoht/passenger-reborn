import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from 'src/guards/jwt.guard';
import { ResponseStrengthGraphEntry } from './schemas/responses/strength-by-day';
import { StatsService } from './stats.service';

@UseGuards(JwtGuard)
@ApiBearerAuth()
@Controller('stats')
@ApiTags('Stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('graph/strength')
  @ApiOperation({ summary: 'Get cumulative passphrase strength over time' })
  @ApiResponse({ type: [ResponseStrengthGraphEntry] })
  async getStrengthGraph() {
    return this.statsService.getStrengthGraph();
  }

  @Get('graph/strength/:accountId')
  @ApiOperation({ summary: 'Get average passphrase strength' })
  @ApiResponse({ type: [ResponseStrengthGraphEntry] })
  async getAverageStrength(@Param('accountId') accountId: string) {
    return this.statsService.getAverageStrengthOfAccount(accountId);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get the total number of passphrases' })
  @ApiResponse({ type: Number })
  async getCount() {
    return this.statsService.getCount();
  }
}
