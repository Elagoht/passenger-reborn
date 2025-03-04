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
import RequestCreateTag from './schemas/create';
import { RequestUpdateTag } from './schemas/update';
import { TagsService } from './tags.service';

@Controller('tags')
export class TagsController {
  public constructor(private readonly tagsService: TagsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tag' })
  public createTag(@Body() data: RequestCreateTag) {
    return this.tagsService.createTag(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tags' })
  public getTags() {
    return this.tagsService.getTags();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tag by id' })
  public getTag(@Param('id') id: string) {
    return this.tagsService.getTag(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tag by id' })
  @ApiBody({ type: RequestUpdateTag })
  @HttpCode(HttpStatus.OK)
  public updateTag(@Param('id') id: string, @Body() data: RequestUpdateTag) {
    return this.tagsService.updateTag(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tag by id' })
  @HttpCode(HttpStatus.NO_CONTENT)
  public deleteTag(@Param('id') id: string) {
    return this.tagsService.deleteTag(id);
  }
}
