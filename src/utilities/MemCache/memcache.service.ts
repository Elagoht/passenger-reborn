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
    key: T | DeterminatedConfiguration,
  ): string | undefined {
    return this.cache.get(key);
  }

  public set<T extends string>(
    key: T | DeterminatedConfiguration,
    value: string,
  ): void {
    this.cache.set(key, value);
  }

  public delete<T extends string>(key: T | DeterminatedConfiguration): void {
    this.cache.delete(key);
  }

  public async onModuleInit() {
    const configurations = await this.prisma.configuration.findMany({
      select: { key: true, value: true },
    });

    configurations.forEach((configuration) => {
      this.cache.set(configuration.key, configuration.value);
    });

    const preferences = await this.prisma.preference.findMany({
      select: { key: true, value: true },
    });

    preferences.forEach((preference) => {
      this.cache.set(preference.key, preference.value);
    });
  }
}
