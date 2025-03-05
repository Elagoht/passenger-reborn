import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../Prisma/prisma.module';
import { GraphCacheService } from './graph-cache.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [GraphCacheService],
  exports: [GraphCacheService],
})
export class GraphCacheModule {}
