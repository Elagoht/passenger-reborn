import {
  LeakFilterDto,
  SortField,
  SortOrder,
} from 'src/resources/leaks/schemas/requests/filter';
import Pagination from '../Pagination';
import Reporter from '../Reporter';

export class LeaksFilter {
  private readonly leaksDB: HIBPLeaksDB;
  private filteredLeaks: HIBPLeakListItem[] = [];

  constructor(leaksDB: HIBPLeaksDB) {
    this.leaksDB = leaksDB;
    // Convert Map to array for easier filtering and sorting
    this.filteredLeaks = Array.from(this.leaksDB.values());
  }

  public filter(filterDto: LeakFilterDto): this {
    // Filter by name (fuzzy search)
    if (filterDto.name) {
      const searchTerm = filterDto.name.toLowerCase();
      this.filteredLeaks = this.filteredLeaks.filter((leak) =>
        this.fuzzyMatch(leak.name, searchTerm),
      );
    }

    // Filter by title (fuzzy search)
    if (filterDto.title) {
      const searchTerm = filterDto.title.toLowerCase();
      this.filteredLeaks = this.filteredLeaks.filter((leak) =>
        this.fuzzyMatch(leak.title, searchTerm),
      );
    }

    // Filter by domain (fuzzy search)
    if (filterDto.domain) {
      const searchTerm = filterDto.domain.toLowerCase();
      this.filteredLeaks = this.filteredLeaks.filter((leak) =>
        this.fuzzyMatch(leak.domain, searchTerm),
      );
    }

    // Filter by date range
    if (filterDto.date || filterDto.dateTo) {
      const fromDate = filterDto.date || new Date(0);
      const toDate = filterDto.dateTo || new Date();

      this.filteredLeaks = this.filteredLeaks.filter((leak) => {
        const leakDate = new Date(leak.date);
        return leakDate >= fromDate && leakDate <= toDate;
      });
    }

    // Filter by pwnCount range
    if (
      filterDto.pwnCount !== undefined ||
      filterDto.pwnCountTo !== undefined
    ) {
      const minCount =
        filterDto.pwnCount !== undefined ? filterDto.pwnCount : 0;
      const maxCount =
        filterDto.pwnCountTo !== undefined
          ? filterDto.pwnCountTo
          : Number.MAX_SAFE_INTEGER;

      this.filteredLeaks = this.filteredLeaks.filter(
        (leak) => leak.pwnCount >= minCount && leak.pwnCount <= maxCount,
      );
    }

    // Filter by verified status
    if (filterDto.verified !== undefined) {
      this.filteredLeaks = this.filteredLeaks.filter(
        (leak) => leak.verified === filterDto.verified,
      );
    }

    return this;
  }

  public sort(filterDto: LeakFilterDto): this {
    if (!filterDto.sortBy) {
      return this;
    }

    const sortField = filterDto.sortBy;
    const sortOrder = filterDto.sortOrder === SortOrder.DESC ? -1 : 1;

    this.filteredLeaks.sort((a, b) => {
      if (sortField === SortField.DATE) {
        return (
          sortOrder * (new Date(a.date).getTime() - new Date(b.date).getTime())
        );
      }

      if (sortField === SortField.PWN_COUNT) {
        return sortOrder * (a.pwnCount - b.pwnCount);
      }

      if (sortField === SortField.VERIFIED) {
        return (
          sortOrder * (a.verified === b.verified ? 0 : a.verified ? 1 : -1)
        );
      }

      // Default string comparison for name, title, domain
      return (
        sortOrder * String(a[sortField]).localeCompare(String(b[sortField]))
      );
    });

    return this;
  }

  public paginate(paginationParams: PaginationParams): HIBPLeakListItem[] {
    const pagination = new Pagination(paginationParams);
    const [startIndex, endIndex] = pagination.getSliceIndex();

    return this.filteredLeaks.slice(startIndex, endIndex);
  }

  public getTotal(): number {
    return this.filteredLeaks.length;
  }

  private fuzzyMatch(text: string, searchTerm: string): boolean {
    if (!searchTerm) return true;

    text = text.toLowerCase();

    // Exact match
    if (text.includes(searchTerm)) {
      return true;
    }

    // Fuzzy match using Levenshtein distance
    // Allow more tolerance for longer search terms
    const maxDistance = Math.max(2, Math.floor(searchTerm.length / 3));
    return Reporter.levenshteinDistance(text, searchTerm) <= maxDistance;
  }
}
