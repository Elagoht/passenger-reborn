import { Injectable } from '@nestjs/common';
import { Tag } from '@prisma/client';
import { ResponseId } from 'src/utilities/Common/schemas/id';
import { PrismaService } from 'src/utilities/Prisma';
import RequestCreateTag from './schemas/request/create';
import { RequestUpdateTag } from './schemas/request/update';
import { ResponseTag } from './schemas/responses/request';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  public async createTag(data: RequestCreateTag): Promise<ResponseId> {
    const tag = await this.prisma.tag.create({ data });
    return { id: tag.id };
  }

  public async getTags(): Promise<ResponseTag[]> {
    return (await this.prisma.tag.findMany()).map((tag) =>
      this.getPublicFields(tag),
    );
  }

  public async getTag(id: string): Promise<ResponseTag> {
    return this.getPublicFields(
      await this.prisma.tag.findUniqueOrThrow({ where: { id } }),
    );
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
