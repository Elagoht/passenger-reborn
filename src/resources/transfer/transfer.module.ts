import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts/accounts.module';
import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';

@Module({
  imports: [AccountsModule],
  controllers: [TransferController],
  providers: [TransferService],
})
export class TransferModule {}
