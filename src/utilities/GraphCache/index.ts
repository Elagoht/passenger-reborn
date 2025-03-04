import { Injectable } from '@nestjs/common';
import { ResponseStrengthGraphEntry } from 'src/resources/stats/schemas/responses/strength-by-day';
import { PrismaService } from '../Prisma';

@Injectable()
export class GraphCacheService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Format a date to YYYY-MM-DD string
   */
  public formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Update cache when new record is added (account created or updated)
   */
  public async onRecordCreated(strength: number, createdAt: Date) {
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
          data: { sum: cacheEntry.sum + strength, count: cacheEntry.count + 1 },
        });
      }
    }
  }

  /**
   * Update cache when record is soft deleted
   */
  public async onRecordDeleted(strength: number, deletedAt: Date) {
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

  /**
   * Get all cached data
   */
  public async getCachedData() {
    return this.prisma.strengthCache.findMany({
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Clear all cached data
   */
  public async clearCache() {
    await this.prisma.strengthCache.deleteMany({});
  }

  /**
   * Create multiple cache entries
   */
  public async createCacheEntries(
    entries: { date: string; sum: number; count: number }[],
  ) {
    if (entries.length > 0) {
      await this.prisma.strengthCache.createMany({
        data: entries,
      });
    }
  }

  public async updateStrengthCache(): Promise<ResponseStrengthGraphEntry[]> {
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
    await this.clearCache();
    await this.createCacheEntries(strengthByDay);

    // Return graph data
    return strengthByDay.map((entry) => ({
      date: entry.date,
      strength: entry.count > 0 ? Math.round(entry.sum / entry.count) : 0,
    }));
  }
}
