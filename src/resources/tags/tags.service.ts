import { Injectable } from '@nestjs/common';
import { Tag } from '@prisma/client';
import { ResponseId } from 'src/utilities/Common/schemas/id';
import { MemCacheService } from 'src/utilities/MemCache/memcache.service';
import { PrismaService } from 'src/utilities/Prisma/prisma.service';
import RequestCreateTag from './schemas/request/create';
import { RequestUpdateTag } from './schemas/request/update';
import { ResponseTag } from './schemas/responses/request';

@Injectable()
export class TagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly memCache: MemCacheService,
  ) {}

  public async createTag(data: RequestCreateTag): Promise<ResponseId> {
    const tag = await this.prisma.tag.create({ data });
    return { id: tag.id };
  }

  public async getTags(): Promise<ResponseTag[]> {
    const tags = await this.prisma.tag.findMany();
    return tags.map((tag) => {
      return {
        ...this.getPublicFields(tag),
        isPanic: tag.id === this.memCache.get('conf-panicTagId'),
      };
    });
  }

  public async getTag(id: string): Promise<ResponseTag> {
    return {
      ...this.getPublicFields(
        await this.prisma.tag.findUniqueOrThrow({ where: { id } }),
      ),
      isPanic: id === this.memCache.get('conf-panicTagId'),
    };
  }

  public async updateTag(id: string, data: RequestUpdateTag): Promise<void> {
    await this.prisma.tag.update({ where: { id }, data });
  }

  public async deleteTag(id: string): Promise<void> {
    await this.prisma.tag.delete({ where: { id } });
  }

  private getPublicFields(tag: Tag) {
    return {
      id: tag.id,
      name: tag.name,
      icon: tag.icon,
      color: tag.color,
    };
  }
}
