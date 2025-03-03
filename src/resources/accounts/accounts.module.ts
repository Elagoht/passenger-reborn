import { Module } from '@nestjs/common';
import { CryptoService } from 'src/utilities/Crypto';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';

@Module({
  controllers: [AccountsController],
  providers: [AccountsService, CryptoService],
})
export class AccountsModule {}
