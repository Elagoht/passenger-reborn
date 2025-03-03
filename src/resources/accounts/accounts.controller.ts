import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtGuard } from 'src/utilities/Guards/jwt.guard';
import { AccountsService } from './accounts.service';
import RequestCreateAccount from './schemas/requests/create';
import RequestUpdateAccount from './schemas/requests/update';

@UseGuards(JwtGuard)
@ApiBearerAuth()
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all accounts',
  })
  async getAccounts() {
    return this.accountsService.getAccounts();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get an account by ID and its history',
  })
  async getAccountById(@Param('id') id: string) {
    return this.accountsService.getAccountById(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new account',
  })
  async createAccount(@Body() body: RequestCreateAccount) {
    return this.accountsService.createAccount(body);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an account by ID',
  })
  async updateAccount(
    @Param('id') id: string,
    @Body() body: RequestUpdateAccount,
  ) {
    return this.accountsService.updateAccount(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete an account by ID',
  })
  async deleteAccount(@Param('id') id: string) {
    return this.accountsService.deleteAccount(id);
  }

  @Get(':id/similar-passphrases')
  @ApiOperation({
    summary: 'Get accounts with similar passphrases by ID',
  })
  async getSimilarAccounts(@Param('id') id: string) {
    return this.accountsService.getSimilarAccounts(id);
  }
}
