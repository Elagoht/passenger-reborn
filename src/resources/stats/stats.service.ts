import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/utilities/Prisma';
import { ResponseStrengthGraphEntry } from './schemas/responses/strength-by-day';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

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
      date: this.formatDate(history.createdAt),
      strength: history.strength,
    }));
  }

  public async getStrengthGraph() {
    const cachedStats = await this.prisma.strengthCache.findMany({
      orderBy: { date: 'asc' },
    });

    if (cachedStats.length > 0) {
      return cachedStats.map((stat) => ({
        date: stat.date,
        strength: stat.count > 0 ? Math.round(stat.sum / stat.count) : 0,
      }));
    }

    return this.updateStrengthCache();
  }

  private async updateStrengthCache(): Promise<ResponseStrengthGraphEntry[]> {
    // Get all PassphraseHistory records
    const historyRecords = await this.prisma.passphraseHistory.findMany({
      select: {
        strength: true,
        createdAt: true,
        deletedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Get unique action days
    const actionDays = [
      ...new Set(historyRecords.map((r) => this.formatDate(r.createdAt))),
    ].sort();

    // Keep active records for cumulative calculation
    const activeRecords: { strength: number; deletedAt: Date | null }[] = [];
    const strengthByDay: { date: string; sum: number; count: number }[] = [];

    // Cumulative calculation for each action day
    for (const day of actionDays) {
      const dayDate = new Date(day);

      // Add records created on this day to active records
      const newRecords = historyRecords.filter(
        (record) => this.formatDate(record.createdAt) === day,
      );
      activeRecords.push(
        ...newRecords.map((record) => ({
          strength: record.strength,
          deletedAt: record.deletedAt,
        })),
      );

      // Remove deleted ones (deletedAt is before or on this day)
      const stillActive = activeRecords.filter(
        (record) => !record.deletedAt || record.deletedAt > dayDate,
      );

      // Calculate cumulative sum and count
      const sum = stillActive.reduce((acc, record) => acc + record.strength, 0);
      const count = stillActive.length;

      strengthByDay.push({ date: day, sum, count });
    }

    // Clear and refill the cache
    await this.prisma.strengthCache.deleteMany({});
    if (strengthByDay.length > 0) {
      await this.prisma.strengthCache.createMany({
        data: strengthByDay.map((entry) => ({
          date: entry.date,
          sum: entry.sum,
          count: entry.count,
        })),
      });
    }

    // Return graph data
    return strengthByDay.map((entry) => ({
      date: entry.date,
      strength: entry.count > 0 ? Math.round(entry.sum / entry.count) : 0,
    }));
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Update cache when new record is added
  public async onPassphraseCreated(strength: number, createdAt: Date) {
    const day = this.formatDate(createdAt);
    const existingDays = await this.prisma.strengthCache.findMany({
      where: { date: { gte: day } },
      orderBy: { date: 'asc' },
    });

    if (existingDays.length === 0) {
      await this.prisma.strengthCache.create({
        data: { date: day, sum: strength, count: 1 },
      });
    } else {
      for (const cacheEntry of existingDays) {
        await this.prisma.strengthCache.update({
          where: { id: cacheEntry.id },
          data: {
            sum: cacheEntry.sum + strength,
            count: cacheEntry.count + 1,
          },
        });
      }
    }
  }

  // Update cache when record is deleted
  public async onPassphraseDeleted(strength: number, deletedAt: Date) {
    const day = this.formatDate(deletedAt);
    const affectedDays = await this.prisma.strengthCache.findMany({
      where: { date: { gte: day } },
      orderBy: { date: 'asc' },
    });

    for (const cacheEntry of affectedDays) {
      await this.prisma.strengthCache.update({
        where: { id: cacheEntry.id },
        data: {
          sum: cacheEntry.sum - strength,
          count: cacheEntry.count - 1,
        },
      });
    }
  }
}
