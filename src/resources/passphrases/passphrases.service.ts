import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/utilities/Prisma';
import Reporter from 'src/utilities/Reporter';
import { Strength } from 'src/utilities/Strength';
import RequestCreatePassphrase from './schemas/requests/create';
import RequestUpdatePassphrase from './schemas/requests/update';

@Injectable()
export class PassphrasesService {
  private static readonly DEFAULT_SIMILARITY_THRESHOLD = 3;

  public constructor(private readonly prisma: PrismaService) {}

  public async getPassphraseEntries() {
    return this.prisma.passphrase.findMany();
  }

  public async getPassphraseEntryById(id: string) {
    return this.prisma.passphrase.findUniqueOrThrow({
      where: { id },
      include: { history: true },
    });
  }

  public async createPassphraseEntry(body: RequestCreatePassphrase) {
    const strength = Strength.evaluate(body.passphrase).score;

    return this.prisma.passphrase.create({
      data: {
        passphrase: body.passphrase,
        platform: body.platform,
        note: body.note,
        icon: body.icon,
        history: { create: { strength } },
      },
    });
  }

  public async updatePassphraseEntry(
    id: string,
    body: RequestUpdatePassphrase,
  ) {
    if (!body.passphrase) {
      return this.prisma.passphrase.update({
        where: { id },
        data: {
          platform: body.platform,
          note: body.note,
          icon: body.icon,
        },
      });
    }

    const shouldUpdate = await this.shouldUpdatePassphrase(id, body.passphrase);
    if (!shouldUpdate) {
      return this.prisma.passphrase.update({
        where: { id },
        data: {
          platform: body.platform,
          note: body.note,
          icon: body.icon,
        },
      });
    }

    const strength = Strength.evaluate(body.passphrase).score;

    return this.prisma.passphrase.update({
      where: { id },
      data: {
        passphrase: body.passphrase,
        platform: body.platform,
        note: body.note,
        icon: body.icon,
        history: {
          create: { strength },
        },
      },
    });
  }

  public async getSimilarPassphraseEntries(
    id: string,
    threshold = PassphrasesService.DEFAULT_SIMILARITY_THRESHOLD,
  ) {
    const targetPassphrase = await this.prisma.passphrase.findUnique({
      where: { id },
    });

    if (!targetPassphrase) {
      throw new NotFoundException('Passphrase not found');
    }

    const allPassphrases = await this.prisma.passphrase.findMany({
      where: { id: { not: id } },
    });

    return allPassphrases
      .map((entry) => ({
        ...entry,
        distance: Reporter.levenshteinDistance(
          entry.passphrase,
          targetPassphrase.passphrase,
        ),
      }))
      .filter((entry) => entry.distance <= threshold);
  }

  public async deletePassphraseEntry(id: string): Promise<void> {
    await this.prisma.passphrase.delete({ where: { id } });
  }

  private async shouldUpdatePassphrase(
    id: string,
    newPassphrase: string,
  ): Promise<boolean> {
    const existingPassphrase = await this.prisma.passphrase.findUnique({
      where: { id },
      select: { passphrase: true },
    });

    if (!existingPassphrase) {
      throw new NotFoundException('Passphrase not found');
    }

    return existingPassphrase.passphrase !== newPassphrase;
  }
}
