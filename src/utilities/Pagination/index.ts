import { Prisma } from '@prisma/client';

const DEFAULT_PAGINATION_TAKE = 12;

class Pagination {
  private readonly page: number;
  private readonly take: number;

  public constructor(pagination: PaginationParams) {
    this.page = pagination.page;
    this.take = pagination.take ?? DEFAULT_PAGINATION_TAKE;
  }

  public getQuery() {
    return {
      skip: (this.page - 1) * this.take,
      take: this.take,
    };
  }

  public getSliceIndex() {
    const startIndex = (this.page - 1) * this.take;
    const endIndex = startIndex + this.take;
    return [startIndex, endIndex];
  }

  public sortNewestAdded() {
    return this.getOrder('createdAt', 'desc');
  }

  public sortOldestAdded() {
    return this.getOrder('createdAt', 'asc');
  }

  public sortNewestUpdated() {
    return this.getOrder('updatedAt', 'desc');
  }

  public sortOldestUpdated() {
    return this.getOrder('updatedAt', 'asc');
  }

  private getOrder(field: string, order: Prisma.SortOrder) {
    return { orderBy: { [field]: order } };
  }
}

export default Pagination;
