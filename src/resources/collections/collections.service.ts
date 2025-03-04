import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/utilities/Prisma';
import RequestCreateCollection from './schemas/create';
import { RequestUpdateCollection } from './schemas/update';

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  public async createCollection(data: RequestCreateCollection) {
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

  public async getCollection(id: string) {
    return await this.prisma.collection.findUniqueOrThrow({
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
            tags: {
              select: {
                id: true,
                name: true,
                color: true,
                icon: true,
              },
            },
          },
        },
      },
    });
  }

  public async updateCollection(id: string, data: RequestUpdateCollection) {
    await this.prisma.collection.update({ where: { id }, data });
  }

  public async deleteCollection(id: string) {
    await this.prisma.collection.delete({ where: { id } });
  }

  public async addAccountToCollection(collectionId: string, accountId: string) {
    await this.prisma.collection.update({
      where: { id: collectionId },
      data: {
        accounts: {
          connect: { id: accountId },
        },
      },
    });
  }

  public async removeAccountFromCollection(
    collectionId: string,
    accountId: string,
  ) {
    await this.prisma.collection.update({
      where: { id: collectionId },
      data: {
        accounts: {
          disconnect: { id: accountId },
        },
      },
      include: {
        accounts: true,
      },
    });
  }
}
