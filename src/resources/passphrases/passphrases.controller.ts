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
import { ApiBearerAuth } from '@nestjs/swagger';
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
  async getPassphrase() {
    return this.passphrasesService.getPassphraseEntries();
  }

  @Get(':id')
  async getPassphraseById(@Param('id') id: string) {
    return this.passphrasesService.getPassphraseEntryById(id);
  }

  @Post()
  async createPassphrase(@Body() body: RequestCreatePassphrase) {
    return this.passphrasesService.createPassphraseEntry(body);
  }

  @Patch(':id')
  async updatePassphrase(
    @Param('id') id: string,
    @Body() body: RequestUpdatePassphrase,
  ) {
    return this.passphrasesService.updatePassphraseEntry(id, body);
  }

  @Delete(':id')
  async deletePassphrase(@Param('id') id: string) {
    return this.passphrasesService.deletePassphraseEntry(id);
  }

  @Get(':id/similar')
  async getSimilarPassphrases(@Param('id') id: string) {
    return this.passphrasesService.getSimilarPassphraseEntries(id);
  }
}
