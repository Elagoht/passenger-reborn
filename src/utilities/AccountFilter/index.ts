import { RequestFilterAccounts } from '../../resources/accounts/schemas/requests/filter';

export class AccountFilter {
  private static readonly MAX_FILTER_LENGTH = 100;
  private static readonly MAX_TAGS_FILTER = 10;
  private static readonly MIN_SEARCH_LENGTH = 2;

  public static sanitizeFilters(filters?: RequestFilterAccounts) {
    if (!filters) return {};

    return {
      ...(filters.search && {
        OR: [
          { platform: { contains: filters.search } },
          { identity: { contains: filters.search } },
          { url: { contains: filters.search } },
        ],
      }),
      ...(filters.platform && {
        platform: { contains: filters.platform },
      }),
      ...(filters.identity && {
        identity: { contains: this.sanitizeStringValue(filters.identity) },
      }),
      ...(filters.url && {
        url: { contains: this.sanitizeStringValue(filters.url) },
      }),
      ...(filters.tags && {
        tags: { some: { id: { in: this.sanitizeTagIds(filters.tags) } } },
      }),
    };
  }

  private static sanitizeStringValue(value: string): string {
    if (value.length < this.MIN_SEARCH_LENGTH) {
      return value;
    }

    // Remove SQL wildcard characters and limit length
    return value.replace(/[%_]/g, '').slice(0, this.MAX_FILTER_LENGTH).trim();
  }

  private static sanitizeTagIds(tagIds: string[]): string[] {
    return tagIds.slice(0, this.MAX_TAGS_FILTER);
  }
}
