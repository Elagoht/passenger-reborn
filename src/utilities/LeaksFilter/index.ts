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

  public filter(query: Record<string, string>): this {
    if (Object.keys(query).length === 0) {
      return this;
    }

    // Filter by name (fuzzy search)
    if (query.name) {
      const searchTerm = query.name.toLowerCase();
      this.filteredLeaks = this.filteredLeaks.filter((leak) =>
        this.fuzzyMatch(leak.name, searchTerm),
      );
    }

    // Filter by title (fuzzy search)
    if (query.title) {
      const searchTerm = query.title.toLowerCase();
      this.filteredLeaks = this.filteredLeaks.filter((leak) =>
        this.fuzzyMatch(leak.title, searchTerm),
      );
    }

    // Filter by domain (fuzzy search)
    if (query.domain) {
      const searchTerm = query.domain.toLowerCase();
      this.filteredLeaks = this.filteredLeaks.filter((leak) =>
        this.fuzzyMatch(leak.domain, searchTerm),
      );
    }

    // Filter by date range
    if (query.date || query.dateTo) {
      const fromDate = query.date ? new Date(query.date) : new Date(0);
      const toDate = query.dateTo ? new Date(query.dateTo) : new Date();

      this.filteredLeaks = this.filteredLeaks.filter((leak) => {
        const leakDate = new Date(leak.date);
        return leakDate >= fromDate && leakDate <= toDate;
      });
    }

    // Filter by pwnCount range
    if (query.pwnCount || query.pwnCountTo) {
      const minCount = query.pwnCount ? parseInt(query.pwnCount, 10) : 0;
      const maxCount = query.pwnCountTo
        ? parseInt(query.pwnCountTo, 10)
        : Number.MAX_SAFE_INTEGER;

      this.filteredLeaks = this.filteredLeaks.filter(
        (leak) => leak.pwnCount >= minCount && leak.pwnCount <= maxCount,
      );
    }

    // Filter by verified status
    if (query.verified !== undefined) {
      const isVerified = query.verified.toLowerCase() === 'true';
      this.filteredLeaks = this.filteredLeaks.filter(
        (leak) => leak.verified === isVerified,
      );
    }

    return this;
  }

  public sort(query: Record<string, string>): this {
    if (!query.sortBy) {
      return this;
    }

    const sortField = query.sortBy as keyof HIBPLeakListItem;
    const sortOrder = query.sortOrder?.toLowerCase() === 'desc' ? -1 : 1;

    this.filteredLeaks.sort((a, b) => {
      if (sortField === 'date') {
        return (
          sortOrder * (new Date(a.date).getTime() - new Date(b.date).getTime())
        );
      }

      if (sortField === 'pwnCount') {
        return sortOrder * (a.pwnCount - b.pwnCount);
      }

      if (sortField === 'verified') {
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
