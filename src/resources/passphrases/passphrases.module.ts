import { Module } from '@nestjs/common';
import { CryptoService } from 'src/utilities/Crypto';
import { PassphrasesController } from './passphrases.controller';
import { PassphrasesService } from './passphrases.service';

@Module({
  controllers: [PassphrasesController],
  providers: [PassphrasesService, CryptoService],
})
export class PassphrasesModule {}
