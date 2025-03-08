import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { ApiPaginationQuery } from 'src/decorators/pagination-query.decorator';
import { Pagination } from 'src/decorators/pagination.decorator';
import { JwtGuard } from 'src/guards/jwt.guard';
import { ResponseId } from 'src/utilities/Common/schemas/id';
import { AccountsService } from './accounts.service';
import RequestCreateAccount from './schemas/requests/create';
import RequestUpdateAccount from './schemas/requests/update';
import {
  ResponseAccountItem,
  ResponseAccountSimilar,
} from './schemas/responses/accounts';
import { ResponsePassphrase } from './schemas/responses/passphrase';

@UseGuards(JwtGuard)
@ApiBearerAuth()
@Controller('accounts')
@ApiTags('Accounts')
export class AccountsController {
  public constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all accounts' })
  @ApiPaginationQuery()
  @ApiResponse({ type: [ResponseAccountItem] })
  public async getAccounts(@Pagination() pagination: PaginationParams) {
    return this.accountsService.getAccounts(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an account by ID' })
  @ApiResponse({ type: ResponseAccountItem })
  public async getAccountById(@Param('id') id: string) {
    return this.accountsService.getAccountById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({ type: ResponseId })
  public async createAccount(@Body() body: RequestCreateAccount) {
    return this.accountsService.createAccount(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an account by ID' })
  public async updateAccount(
    @Param('id') id: string,
    @Body() body: RequestUpdateAccount,
  ) {
    return this.accountsService.updateAccount(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an account by ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  public async deleteAccount(@Param('id') id: string) {
    return this.accountsService.deleteAccount(id);
  }

  @Get(':id/similar-passphrases')
  @ApiOperation({ summary: 'Get accounts with similar passphrases by ID' })
  @ApiResponse({ type: [ResponseAccountSimilar] })
  public async getSimilarAccounts(@Param('id') id: string) {
    return this.accountsService.getSimilarAccounts(id);
  }

  @Post(':id/tags/:tagId')
  @ApiOperation({ summary: 'Add a tag to an account' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiParam({ name: 'tagId', description: 'Tag ID' })
  @HttpCode(200)
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

  @Get(':id/passphrase')
  @ApiOperation({ summary: 'Get the decrypted passphrase for an account' })
  @ApiResponse({ type: ResponsePassphrase })
  public async getAccountPassphrase(@Param('id') id: string) {
    return this.accountsService.getAccountPassphrase(id);
  }
}
