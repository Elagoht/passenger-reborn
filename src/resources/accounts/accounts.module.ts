import { Module } from '@nestjs/common';
import { CryptoModule } from 'src/utilities/Crypto/crypto.module';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';

@Module({
  imports: [CryptoModule],
  controllers: [AccountsController],
  providers: [AccountsService],
})
export class AccountsModule {}
