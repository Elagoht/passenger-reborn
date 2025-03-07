import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from 'src/guards/jwt.guard';
import { RequestImportWordList } from './schemas/requests/import';
import {
  ResponseWordList,
  ResponseWordListCard,
} from './schemas/responses/wordlists';
import { WordListsService } from './wordlists.service';

@Controller('word-lists')
@ApiTags('Word Lists')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class WordListsController {
  constructor(private readonly wordListsService: WordListsService) {}

  @Post('import')
  @ApiOperation({ summary: 'Import a new word list via URL' })
  @ApiBody({ type: RequestImportWordList })
  async importWordList(@Body() createWordListDto: RequestImportWordList) {
    return this.wordListsService.importWordList(createWordListDto.url);
  }

  @Get()
  @ApiOperation({ summary: 'Get all word lists with card details' })
  @ApiResponse({
    description: 'The list of word lists',
    type: [ResponseWordListCard],
  })
  async getWordLists() {
    return this.wordListsService.getWordLists();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a word list by ID with all details' })
  @ApiResponse({ description: 'The word list', type: ResponseWordList })
  async getWordList(@Param('id') id: string) {
    return this.wordListsService.getWordList(id);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get the status of a word list' })
  async getWordListStatus(@Param('id') id: string) {
    return this.wordListsService.getWordListStatus(id);
  }

  @Post(':id/download')
  @ApiOperation({ summary: 'Start the download process for a word list' })
  async downloadWordList(@Param('id') id: string) {
    return this.wordListsService.downloadWordList(id);
  }

  @Post(':id/cancel-download')
  @ApiOperation({ summary: 'Cancel the download process for a word list' })
  async cancelWordListDownload(@Param('id') id: string) {
    return this.wordListsService.cancelWordListDownload(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a word list by ID' })
  async deleteWordList(@Param('id') id: string) {
    return this.wordListsService.deleteWordList(id);
  }

  @Post(':id/validate')
  @ApiOperation({ summary: 'Validate a word list by ID' })
  async validateWordList(@Param('id') id: string) {
    return this.wordListsService.triggerValidateDownloadedRepository(id);
  }
}
