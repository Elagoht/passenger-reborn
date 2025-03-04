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
} from '@nestjs/common';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import { CollectionsService } from './collections.service';
import RequestCreateCollection from './schemas/create';
import { RequestUpdateCollection } from './schemas/update';

@Controller('collections')
export class CollectionsController {
  public constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new collection' })
  public createCollection(@Body() data: RequestCreateCollection) {
    return this.collectionsService.createCollection(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tags' })
  public getCollections() {
    return this.collectionsService.getCollections();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tag by id' })
  public getCollection(@Param('id') id: string) {
    return this.collectionsService.getCollection(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tag by id' })
  @ApiBody({ type: RequestUpdateCollection })
  @HttpCode(HttpStatus.OK)
  public updateCollection(
    @Param('id') id: string,
    @Body() data: RequestUpdateCollection,
  ) {
    return this.collectionsService.updateCollection(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tag by id' })
  @HttpCode(HttpStatus.NO_CONTENT)
  public deleteCollection(@Param('id') id: string) {
    return this.collectionsService.deleteCollection(id);
  }
}
