import { Injectable } from '@nestjs/common';
import { Tag } from '@prisma/client';
import { PrismaService } from 'src/utilities/Prisma';
import RequestCreateTag from './schemas/create';
import { RequestUpdateTag } from './schemas/update';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  public async createTag(data: RequestCreateTag) {
    const tag = await this.prisma.tag.create({ data });
    return { id: tag.id };
  }

  public async getTags() {
    return (await this.prisma.tag.findMany()).map((tag) =>
      this.getPublicFields(tag),
    );
  }

  public async getTag(id: string) {
    return this.getPublicFields(
      await this.prisma.tag.findUniqueOrThrow({ where: { id } }),
    );
  }

  public async updateTag(id: string, data: RequestUpdateTag) {
    await this.prisma.tag.update({ where: { id }, data });
  }

  public async deleteTag(id: string) {
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
