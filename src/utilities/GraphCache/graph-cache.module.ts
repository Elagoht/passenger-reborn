import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../Prisma/prisma.module';
import { GraphCacheService } from './index';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [GraphCacheService],
  exports: [GraphCacheService],
})
export class GraphCacheModule {}
