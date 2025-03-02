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
import { PassphraseService } from './passphrases.service';
import RequestCreatePassphrase from './schemas/requests/create';
import RequestUpdatePassphrase from './schemas/requests/update';

@UseGuards(JwtGuard)
@ApiBearerAuth()
@Controller('passphrase')
export class PassphraseController {
  constructor(private readonly passphraseService: PassphraseService) {}

  @Get()
  async getPassphrase() {
    return this.passphraseService.getPassphraseEntries();
  }

  @Get(':id')
  async getPassphraseById(@Param('id') id: string) {
    return this.passphraseService.getPassphraseEntryById(id);
  }

  @Post()
  async createPassphrase(@Body() body: RequestCreatePassphrase) {
    return this.passphraseService.createPassphraseEntry(body);
  }

  @Patch(':id')
  async updatePassphrase(
    @Param('id') id: string,
    @Body() body: RequestUpdatePassphrase,
  ) {
    return this.passphraseService.updatePassphraseEntry(id, body);
  }

  @Delete(':id')
  async deletePassphrase(@Param('id') id: string) {
    return this.passphraseService.deletePassphraseEntry(id);
  }

  @Get(':id/similar')
  async getSimilarPassphrases(@Param('id') id: string) {
    return this.passphraseService.getSimilarPassphraseEntries(id);
  }
}
