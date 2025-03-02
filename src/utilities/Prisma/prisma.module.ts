import { Global, Module } from '@nestjs/common';
import { PrismaService } from './index';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
