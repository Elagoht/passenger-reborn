import { Module } from '@nestjs/common';
import { LeaksController } from './leaks.controller';
import { LeaksService } from './leaks.service';

@Module({
  controllers: [LeaksController],
  providers: [LeaksService],
  exports: [LeaksService],
})
export class LeaksModule {}
