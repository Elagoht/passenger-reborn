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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationQuery } from 'src/utilities/Decorators/pagination-query.decorator';
import { Pagination } from 'src/utilities/Decorators/pagination.decorator';
import { JwtGuard } from 'src/utilities/Guards/jwt.guard';
import { AccountsService } from './accounts.service';
import RequestCreateAccount from './schemas/requests/create';
import RequestUpdateAccount from './schemas/requests/update';
import { ResponseAccountItem } from './schemas/responses/accounts';

@UseGuards(JwtGuard)
@ApiBearerAuth()
@Controller('accounts')
@ApiTags('Accounts')
export class AccountsController {
  public constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all accounts' })
  @PaginationQuery()
  @ApiResponse({ type: [ResponseAccountItem] })
  public async getAccounts(@Pagination() pagination: PaginationParams) {
    return this.accountsService.getAccounts(pagination);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get an account by ID and its history',
  })
  public async getAccountById(@Param('id') id: string) {
    return this.accountsService.getAccountById(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new account',
  })
  public async createAccount(@Body() body: RequestCreateAccount) {
    return this.accountsService.createAccount(body);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an account by ID',
  })
  public async updateAccount(
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
  public async deleteAccount(@Param('id') id: string) {
    return this.accountsService.deleteAccount(id);
  }

  @Get(':id/similar-passphrases')
  @ApiOperation({
    summary: 'Get accounts with similar passphrases by ID',
  })
  public async getSimilarAccounts(@Param('id') id: string) {
    return this.accountsService.getSimilarAccounts(id);
  }

  @Post(':id/tags/:tagId')
  @ApiOperation({ summary: 'Add a tag to an account' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiParam({ name: 'tagId', description: 'Tag ID' })
  public async addTagToAccount(
    @Param('id') id: string,
    @Param('tagId') tagId: string,
  ) {
    return this.accountsService.addTagToAccount(id, tagId);
  }

  @Delete(':id/tags/:tagId')
  @ApiOperation({ summary: 'Remove a tag from an account' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiParam({ name: 'tagId', description: 'Tag ID' })
  public async removeTagFromAccount(
    @Param('id') id: string,
    @Param('tagId') tagId: string,
  ) {
    return this.accountsService.removeTagFromAccount(id, tagId);
  }
}
