import { Prisma } from '@prisma/client';

class Pagination {
  private readonly page: number;
  private readonly take: number | undefined;

  public constructor(pagination: PaginationParams) {
    this.page = pagination.page;
    this.take = pagination.take;
  }

  public getQuery() {
    return {
      skip: (this.page - 1) * (this.take ?? 1),
      take: this.take,
    };
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
