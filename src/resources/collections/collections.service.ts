import { Injectable } from '@nestjs/common';
import { Collection } from '@prisma/client';
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
    return (await this.prisma.collection.findMany()).map((collection) =>
      this.getPublicFields(collection),
    );
  }

  public async getCollection(id: string) {
    return this.getPublicFields(
      await this.prisma.collection.findUniqueOrThrow({ where: { id } }),
    );
  }

  public async updateCollection(id: string, data: RequestUpdateCollection) {
    await this.prisma.collection.update({ where: { id }, data });
  }

  public async deleteCollection(id: string) {
    await this.prisma.collection.delete({ where: { id } });
  }

  private getPublicFields(collection: Collection) {
    return {
      id: collection.id,
      name: collection.name,
      description: collection.description,
    };
  }
}
