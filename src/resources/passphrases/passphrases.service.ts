import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/utilities/Prisma';
import Reporter from 'src/utilities/Reporter';
import { Strength } from 'src/utilities/Strength';
import RequestCreatePassphrase from './schemas/requests/create';
import RequestUpdatePassphrase from './schemas/requests/update';

@Injectable()
export class PassphraseService {
  private static readonly DEFAULT_SIMILARITY_THRESHOLD = 3;

  constructor(private readonly prisma: PrismaService) {}

  async getPassphraseEntries() {
    return this.prisma.passphrase.findMany();
  }

  async getPassphraseEntryById(id: string) {
    return this.prisma.passphrase.findUniqueOrThrow({
      where: { id },
    });
  }

  async createPassphraseEntry(body: RequestCreatePassphrase) {
    return this.prisma.passphrase.create({
      data: {
        passphrase: body.passphrase,
        platform: body.platform,
        note: body.note,
        icon: body.icon,
        history: {
          create: {
            strength: Strength.evaluate(body.passphrase).score,
          },
        },
      },
    });
  }

  async updatePassphraseEntry(id: string, body: RequestUpdatePassphrase) {
    return this.prisma.passphrase.update({
      where: { id },
      data: body,
    });
  }

  async getSimilarPassphraseEntries(
    id: string,
    threshold = PassphraseService.DEFAULT_SIMILARITY_THRESHOLD,
  ) {
    const allPassphrases = await this.prisma.passphrase.findMany({
      where: {
        id: { not: id },
      },
    });

    const similaritry = allPassphrases.map((passphrase) => ({
      ...passphrase,
      distance: Reporter.levenshteinDistance(
        passphrase.passphrase,
        passphrase.passphrase,
      ),
    }));

    return similaritry.filter((passphrase) => passphrase.distance <= threshold);
  }

  async deletePassphraseEntry(id: string) {
    return this.prisma.passphrase.delete({ where: { id } });
  }
}
