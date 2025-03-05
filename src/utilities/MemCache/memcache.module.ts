import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../Prisma/prisma.module';
import { MemCacheService } from './memcache.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [MemCacheService],
  exports: [MemCacheService],
})
export class MemCacheModule {}
