import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from 'src/guards/jwt.guard';
import { ResponseAccountCardItem } from '../accounts/schemas/responses/accounts';
import { PanicService } from './panic.service';

@UseGuards(JwtGuard)
@ApiBearerAuth()
@Controller('panic')
@ApiTags('Panic')
export class PanicController {
  constructor(private readonly panicService: PanicService) {}

  @Get()
  @ApiOperation({ summary: 'Get all accounts tagged with panic tag' })
  @ApiResponse({ type: ResponseAccountCardItem })
  public async getPanicAccounts() {
    return this.panicService.getPanicAccounts();
  }
}
