import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtGuard } from 'src/utilities/Guards/jwt.guard';
import { PassphrasesService } from './passphrases.service';
import RequestCreatePassphrase from './schemas/requests/create';
import RequestUpdatePassphrase from './schemas/requests/update';

@UseGuards(JwtGuard)
@ApiBearerAuth()
@Controller('passphrases')
export class PassphrasesController {
  constructor(private readonly passphrasesService: PassphrasesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all passphrases',
  })
  async getPassphrase() {
    return this.passphrasesService.getPassphraseEntries();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a passphrase by ID and its history',
  })
  async getPassphraseById(@Param('id') id: string) {
    return this.passphrasesService.getPassphraseEntryById(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new passphrase',
  })
  async createPassphrase(@Body() body: RequestCreatePassphrase) {
    return this.passphrasesService.createPassphraseEntry(body);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a passphrase by ID',
  })
  async updatePassphrase(
    @Param('id') id: string,
    @Body() body: RequestUpdatePassphrase,
  ) {
    return this.passphrasesService.updatePassphraseEntry(id, body);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a passphrase by ID',
  })
  async deletePassphrase(@Param('id') id: string) {
    return this.passphrasesService.deletePassphraseEntry(id);
  }

  @Get(':id/similar')
  @ApiOperation({
    summary: 'Get similar passphrases by ID',
  })
  async getSimilarPassphrases(@Param('id') id: string) {
    return this.passphrasesService.getSimilarPassphraseEntries(id);
  }
}
