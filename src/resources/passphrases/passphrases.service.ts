import { Injectable, NotFoundException } from '@nestjs/common';
import { CryptoService } from 'src/utilities/Crypto';
import { PrismaService } from 'src/utilities/Prisma';
import Reporter from 'src/utilities/Reporter';
import { Strength } from 'src/utilities/Strength';
import RequestCreatePassphrase from './schemas/requests/create';
import RequestUpdatePassphrase from './schemas/requests/update';

@Injectable()
export class PassphrasesService {
  private static readonly DEFAULT_SIMILARITY_THRESHOLD = 3;

  public constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

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
    const hashedPassphrase = await this.crypto.hash(body.passphrase);
    const strength = Strength.evaluate(body.passphrase).score;

    return this.prisma.passphrase.create({
      data: {
        passphrase: hashedPassphrase,
        platform: body.platform,
        note: body.note,
        icon: body.icon,
        history: {
          create: { strength },
        },
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

    const hashedPassphrase = await this.crypto.hash(body.passphrase);
    const strength = Strength.evaluate(body.passphrase).score;

    return this.prisma.passphrase.update({
      where: { id },
      data: {
        passphrase: hashedPassphrase,
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

  public async deletePassphraseEntry(id: string) {
    return this.prisma.passphrase.delete({ where: { id } });
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

    const isSame = await this.crypto.compare(
      newPassphrase,
      existingPassphrase.passphrase,
    );

    return !isSame;
  }
}
