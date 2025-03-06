import { Injectable } from '@nestjs/common';
import { ResponseId } from 'src/utilities/Common/schemas/id';
import { MemCacheService } from 'src/utilities/MemCache/memcache.service';
import { PrismaService } from 'src/utilities/Prisma/prisma.service';
import { RequestCreateCollection } from './schemas/requests/create';
import { RequestUpdateCollection } from './schemas/requests/update';
import { ResponseCollection } from './schemas/responses/collections';

@Injectable()
export class CollectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly memCache: MemCacheService,
  ) {}

  public async createCollection(
    data: RequestCreateCollection,
  ): Promise<ResponseId> {
    const collection = await this.prisma.collection.create({ data });
    return { id: collection.id };
  }

  public async getCollections() {
    const collections = await this.prisma.collection.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { accounts: true } },
      },
    });

    return collections.map((collection) => ({
      id: collection.id,
      name: collection.name,
      description: collection.description,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
      accountCount: collection._count.accounts,
    }));
  }

  public async getCollection(id: string): Promise<ResponseCollection> {
    const collection = await this.prisma.collection.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        accounts: {
          select: {
            id: true,
            platform: true,
            url: true,
            note: true,
            icon: true,
            tags: { select: { id: true, name: true, color: true, icon: true } },
          },
        },
      },
    });

    return {
      ...collection,
      accounts: collection.accounts.map((account) => ({
        ...account,
        tags: account.tags.map((tag) => ({
          ...tag,
          isPanic:
            tag.id === this.memCache.get('conf-panicTagId') ? true : undefined,
        })),
      })),
    };
  }

  public async updateCollection(
    id: string,
    data: RequestUpdateCollection,
  ): Promise<void> {
    await this.prisma.collection.update({ where: { id }, data });
  }

  public async deleteCollection(id: string): Promise<void> {
    await this.prisma.collection.delete({ where: { id } });
  }

  public async addAccountToCollection(
    collectionId: string,
    accountId: string,
  ): Promise<void> {
    await this.prisma.collection.update({
      where: { id: collectionId },
      data: { accounts: { connect: { id: accountId } } },
    });
  }

  public async removeAccountFromCollection(
    collectionId: string,
    accountId: string,
  ): Promise<void> {
    await this.prisma.collection.update({
      where: { id: collectionId },
      data: { accounts: { disconnect: { id: accountId } } },
      include: { accounts: true },
    });
  }
}
