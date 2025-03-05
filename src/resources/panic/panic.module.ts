import { Module } from '@nestjs/common';
import { PanicController } from './panic.controller';
import { PanicService } from './panic.service';

@Module({
  controllers: [PanicController],
  providers: [PanicService],
})
export class PanicModule {}
