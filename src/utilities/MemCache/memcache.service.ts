import { Global, Injectable } from '@nestjs/common';

@Global()
@Injectable()
export class MemCacheService {
  private readonly cache: MemCache;

  public constructor() {
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
}
