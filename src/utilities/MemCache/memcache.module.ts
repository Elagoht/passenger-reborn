import { Module } from '@nestjs/common';
import { MemCacheService } from './memcache.service';

@Module({
  providers: [MemCacheService],
  exports: [MemCacheService],
})
export class MemCacheModule {}
