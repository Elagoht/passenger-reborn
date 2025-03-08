import { Injectable } from '@nestjs/common';
import { MemCacheService } from 'src/utilities/MemCache/memcache.service';
import { PrismaService } from 'src/utilities/Prisma/prisma.service';
import { ResponseAccountItem } from '../accounts/schemas/responses/accounts';

@Injectable()
export class PanicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly memCache: MemCacheService,
  ) {}

  public async getPanicAccounts(): Promise<ResponseAccountItem[]> {
    const panicTagId = this.memCache.get('conf-panicTagId');
    if (!panicTagId) throw new Error('Not implemented');

    const accounts = await this.prisma.account.findMany({
      where: { tags: { some: { id: panicTagId } } },
      select: {
        id: true,
        platform: true,
        identity: true,
        url: true,
        note: true,
        icon: true,
        tags: { select: { id: true, name: true, icon: true, color: true } },
      },
    });

    return accounts.map((account) => ({
      ...account,
      tags: account.tags.map((tag) => ({
        ...tag,
        isPanic: tag.id === panicTagId ? true : undefined,
      })),
    }));
  }
}
