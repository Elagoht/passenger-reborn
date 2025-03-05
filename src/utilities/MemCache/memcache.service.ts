import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../Prisma/prisma.service';

@Injectable()
export class MemCacheService implements OnModuleInit {
  private readonly cache: MemCache;

  public constructor(private readonly prisma: PrismaService) {
    this.cache = new Map();
  }

  public getAll(): MemCache {
    return this.cache;
  }

  public get<T extends string>(
    key: T | DeterminatedSetting,
  ): string | undefined {
    return this.cache.get(key);
  }

  public set<T extends string>(
    key: T | DeterminatedSetting,
    value: string,
  ): void {
    this.cache.set(key, value);
  }

  public delete<T extends string>(key: T | DeterminatedSetting): void {
    this.cache.delete(key);
  }

  public async onModuleInit() {
    const settings = await this.prisma.setting.findMany({
      select: { key: true, value: true },
    });

    settings.forEach((setting) => {
      this.cache.set(setting.key, setting.value);
    });
  }
}
