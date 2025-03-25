import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { LeaksFilter } from 'src/utilities/LeaksFilter';
import { MemCacheService } from 'src/utilities/MemCache/memcache.service';
import { LeakFilterDto } from './schemas/requests/filter';
import ResponseLeakResults, { ResponseLeak } from './schemas/responses/results';

@Injectable()
export class LeaksService implements OnModuleInit {
  private readonly leaksDB: HIBPLeaksDB;
  private readonly INVALIDATE_CACHE_TRESHOLD = 1000 * 60 * 60 * 24; // 24 hours
  private readonly HIBP_API_URL = 'https://haveibeenpwned.com/api/v3/breaches';

  public constructor(private readonly memCache: MemCacheService) {
    this.leaksDB = new Map();
  }

  public async getLeaks(
    filterDto: LeakFilterDto,
    paginationParams: PaginationParams,
  ): Promise<ResponseLeakResults> {
    const leaks = await this.findLeaks(filterDto, paginationParams);
    return this.prepareResponse(leaks.data, leaks.total, paginationParams);
  }

  public async getLeakById(id: string): Promise<ResponseLeak> {
    const allLeaks = await this.getAllLeaks();
    const leak = allLeaks.get(id);
    if (!leak) throw new NotFoundException('Leak not found');
    return leak;
  }

  public async getNews(): Promise<ResponseLeak[]> {
    const paginationParams = { page: 1, take: 12 };
    const leaksDB = await this.getAllLeaks();

    const leaks = Array.from(leaksDB.values())
      .filter((leak) => leak.verified)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, paginationParams.take);

    return leaks;
  }

  private async findLeaks(
    filterDto: LeakFilterDto,
    paginationParams: PaginationParams,
  ): Promise<HIBPLeaksDBPrepared> {
    const leaksDB = await this.getAllLeaks();

    // Use the LeaksFilter utility to filter, sort, and paginate
    const leaksFilter = new LeaksFilter(leaksDB);
    const filteredLeaks = leaksFilter.filter(filterDto).sort(filterDto);

    return {
      data: filteredLeaks.paginate(paginationParams),
      total: filteredLeaks.getTotal(),
    };
  }

  private async getAllLeaks(): Promise<HIBPLeaksDB> {
    // If cache is valid and we have data, return the cached data
    if (!this.shouldRefreshCache() && this.leaksDB.size > 0) {
      return Promise.resolve(this.leaksDB);
    }

    // Otherwise, update the leaks
    return await this.updateLeaks();
  }

  private async updateLeaks(): Promise<HIBPLeaksDB> {
    const leaks = await this.fetchLeaksFromHIBP();
    const parsedLeaks = this.parseLeaks(leaks);
    this.leaksDB.clear();
    parsedLeaks.forEach((leak) => this.leaksDB.set(leak.id, leak));

    // Update the cache timestamp
    this.memCache.set('leaksCheckedAt', new Date().toISOString());

    return this.leaksDB;
  }

  private async fetchLeaksFromHIBP(): Promise<HIBPLeakRaw[]> {
    try {
      const response = await fetch(this.HIBP_API_URL);
      return (await response.json()) as HIBPLeakRaw[];
    } catch (error) {
      Logger.error(error);
      throw new Error('Failed to fetch leaks from HIBP');
    }
  }

  private parseLeaks(leaks: HIBPLeakRaw[]): HIBPLeakListItem[] {
    return leaks.map((leak) => ({
      id: randomUUID(),
      name: leak.Name,
      title: leak.Title,
      domain: leak.Domain,
      date: leak.BreachDate,
      pwnCount: leak.PwnCount,
      verified: leak.IsVerified,
      logo: leak.LogoPath,
    }));
  }

  private prepareResponse(
    leaks: HIBPLeakListItem[],
    total: number,
    paginationParams: PaginationParams,
  ): ResponseLeakResults {
    return {
      page: paginationParams.page,
      take: paginationParams.take,
      total,
      data: leaks.map((leak) => ({
        id: leak.id,
        name: leak.name,
        title: leak.title,
        domain: leak.domain,
        date: leak.date,
        pwnCount: leak.pwnCount,
        verified: leak.verified,
        logo: leak.logo,
      })),
    };
  }

  private shouldRefreshCache(): boolean {
    const cache = this.memCache.get('conf-leaksCheckedAt');
    if (!cache) return true;

    const lastChecked = new Date(cache);
    const difference = new Date().getTime() - lastChecked.getTime();

    return difference > this.INVALIDATE_CACHE_TRESHOLD;
  }

  public async onModuleInit() {
    // Initialize the leaks database on module initialization
    await this.updateLeaks();
  }
}
