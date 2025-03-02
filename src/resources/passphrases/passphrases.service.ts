import { Injectable } from '@nestjs/common';
import { CryptoService } from 'src/utilities/Crypto';
import { PrismaService } from 'src/utilities/Prisma';
import Reporter from 'src/utilities/Reporter';
import { Strength } from 'src/utilities/Strength';
import RequestCreatePassphrase from './schemas/requests/create';
import RequestUpdatePassphrase from './schemas/requests/update';

@Injectable()
export class PassphraseService {
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
    });
  }

  public async createPassphraseEntry(body: RequestCreatePassphrase) {
    return this.prisma.passphrase.create({
      data: {
        passphrase: body.passphrase,
        platform: body.platform,
        note: body.note,
        icon: body.icon,
        history: {
          create: { strength: Strength.evaluate(body.passphrase).score },
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
        data: body,
      });
    }

    const shouldUpdate = await this.shouldUpdatePassphrase(id, body.passphrase);
    if (!shouldUpdate) {
      return this.prisma.passphrase.update({
        where: { id },
        data: body,
      });
    }

    const { passphrase, history } = await this.preparePassphraseUpdate(
      body.passphrase,
    );

    return this.prisma.passphrase.update({
      where: { id },
      data: {
        ...body,
        passphrase,
        history,
      },
    });
  }

  public async getSimilarPassphraseEntries(
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

    return existingPassphrase?.passphrase !== newPassphrase;
  }

  private async preparePassphraseUpdate(passphrase: string) {
    const strength = Strength.evaluate(passphrase).score;
    const hashedPassphrase = await this.crypto.hash(passphrase);

    return {
      passphrase: hashedPassphrase,
      history: {
        create: {
          strength,
        },
      },
    };
  }
}
