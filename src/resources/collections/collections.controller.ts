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
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseId } from 'src/utilities/Common/schemas/id';
import { JwtGuard } from 'src/utilities/Guards/jwt.guard';
import { CollectionsService } from './collections.service';
import { RequestCreateCollection } from './schemas/requests/create';
import { RequestUpdateCollection } from './schemas/requests/update';
import {
  ResponseCollection,
  ResponseCollectionListItem,
} from './schemas/responses/collections';

@UseGuards(JwtGuard)
@ApiBearerAuth()
@Controller('collections')
@ApiTags('Collections')
export class CollectionsController {
  public constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new collection' })
  @ApiBody({ type: RequestCreateCollection })
  @ApiResponse({ type: ResponseId })
  public createCollection(@Body() data: RequestCreateCollection) {
    return this.collectionsService.createCollection(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all collections' })
  @ApiResponse({ type: [ResponseCollectionListItem] })
  public getCollections() {
    return this.collectionsService.getCollections();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a collection by id' })
  @ApiResponse({ type: ResponseCollection })
  public getCollection(@Param('id') id: string) {
    return this.collectionsService.getCollection(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a collection by id' })
  @ApiBody({ type: RequestUpdateCollection })
  @HttpCode(HttpStatus.OK)
  public updateCollection(
    @Param('id') id: string,
    @Body() data: RequestUpdateCollection,
  ) {
    return this.collectionsService.updateCollection(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a collection by id' })
  @HttpCode(HttpStatus.NO_CONTENT)
  public deleteCollection(@Param('id') id: string) {
    return this.collectionsService.deleteCollection(id);
  }

  @Post(':id/accounts/:accountId')
  @ApiOperation({ summary: 'Add an account to a collection' })
  @ApiParam({ name: 'id', description: 'Collection ID' })
  @ApiParam({ name: 'accountId', description: 'Account ID' })
  @HttpCode(HttpStatus.OK)
  public addAccountToCollection(
    @Param('id') id: string,
    @Param('accountId') accountId: string,
  ) {
    return this.collectionsService.addAccountToCollection(id, accountId);
  }

  @Delete(':id/accounts/:accountId')
  @ApiOperation({ summary: 'Remove an account from a collection' })
  @ApiParam({ name: 'id', description: 'Collection ID' })
  @ApiParam({ name: 'accountId', description: 'Account ID' })
  public removeAccountFromCollection(
    @Param('id') id: string,
    @Param('accountId') accountId: string,
  ) {
    return this.collectionsService.removeAccountFromCollection(id, accountId);
  }
}
