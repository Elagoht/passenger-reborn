import { Injectable } from '@nestjs/common';
import { GraphCacheService } from 'src/utilities/GraphCache';
import { PrismaService } from 'src/utilities/Prisma';
import { ResponseStrengthGraphEntry } from './schemas/responses/strength-by-day';

@Injectable()
export class StatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly graphCache: GraphCacheService,
  ) {}

  public async getAverageStrengthOfAccount(
    accountId: string,
  ): Promise<ResponseStrengthGraphEntry[]> {
    const accountHistories = await this.prisma.account.findUniqueOrThrow({
      where: { id: accountId },
      select: {
        history: {
          select: {
            strength: true,
            createdAt: true,
          },
        },
      },
    });

    return accountHistories.history.map((history) => ({
      date: this.graphCache.formatDate(history.createdAt),
      strength: history.strength,
    }));
  }

  public async getStrengthGraph() {
    const cachedStats = await this.graphCache.getCachedData();

    if (cachedStats.length > 0) {
      return cachedStats.map((stat) => ({
        date: stat.date,
        strength: stat.count > 0 ? Math.round(stat.sum / stat.count) : 0,
      }));
    }

    return this.graphCache.updateStrengthCache();
  }
}
