import { Module } from '@nestjs/common';
import { CryptoService } from 'src/utilities/Crypto';
import { StatsModule } from '../stats/stats.module';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';

@Module({
  imports: [StatsModule],
  controllers: [AccountsController],
  providers: [AccountsService, CryptoService],
})
export class AccountsModule {}
