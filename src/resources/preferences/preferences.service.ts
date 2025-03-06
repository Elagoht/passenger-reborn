import { Injectable } from '@nestjs/common';
import { MemCacheService } from 'src/utilities/MemCache/memcache.service';
import { PrismaService } from 'src/utilities/Prisma/prisma.service';
import { RequestSetPreference } from './schemas/requests/preference';
import { ResponsePreference } from './schemas/responses/preferences';

@Injectable()
export class PreferencesService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly memcache: MemCacheService,
  ) {}

  public async getPreferences(): Promise<ResponsePreference[]> {
    // Always update the cache when getting preferences
    const preferences = await this.prisma.preference.findMany();
    preferences.forEach((preference) => {
      this.memcache.set(`pref-${preference.key}`, preference.value);
    });

    return preferences.map((preference) => ({
      key: preference.key,
      value: preference.value,
    }));
  }

  public async getPreference(key: string): Promise<ResponsePreference> {
    const cached = this.memcache.get(`pref-${key}`);
    if (cached) return { key, value: cached };

    const setting = await this.prisma.preference.findUnique({ where: { key } });
    if (setting) this.memcache.set(`pref-${key}`, setting.value);
    return setting || { key, value: '' };
  }

  public async setPreference(
    key: string,
    body: RequestSetPreference,
  ): Promise<void> {
    await this.prisma.preference.update({
      where: { key },
      data: { value: body.value },
    });
    this.memcache.set(`pref-${key}`, body.value);
  }
}
