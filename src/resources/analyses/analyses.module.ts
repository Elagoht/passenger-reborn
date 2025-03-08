import { Module } from '@nestjs/common';
import { CryptoModule } from 'src/utilities/Crypto/crypto.module';
import { PrismaModule } from 'src/utilities/Prisma/prisma.module';
import { AnalysesController } from './analyses.controller';
import { AnalysesService } from './analyses.service';

@Module({
  imports: [PrismaModule, CryptoModule],
  controllers: [AnalysesController],
  providers: [AnalysesService],
  exports: [AnalysesService],
})
export class AnalysesModule {}
