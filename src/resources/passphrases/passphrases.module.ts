import { Module } from '@nestjs/common';
import { PassphraseController } from './passphrases.controller';
import { PassphraseService } from './passphrases.service';

@Module({
  controllers: [PassphraseController],
  providers: [PassphraseService],
})
export class PassphraseModule {}
