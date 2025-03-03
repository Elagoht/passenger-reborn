import { Injectable, NotFoundException } from '@nestjs/common';
import { CryptoService } from 'src/utilities/Crypto';
import { PrismaService } from 'src/utilities/Prisma';
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
    const entries = await this.prisma.passphrase.findMany();
    return entries.map((entry) => ({
      ...entry,
      passphrase: this.crypto.decrypt(entry.passphrase),
    }));
  }

  public async getPassphraseEntryById(id: string) {
    const entry = await this.prisma.passphrase.findUniqueOrThrow({
      where: { id },
      include: { history: true },
    });

    return {
      ...entry,
      passphrase: this.crypto.decrypt(entry.passphrase),
    };
  }

  public async createPassphraseEntry(body: RequestCreatePassphrase) {
    const strength = Strength.evaluate(body.passphrase).score;
    const encryptedPassphrase = this.crypto.encrypt(body.passphrase);
    const simhash = this.crypto.generateSimhash(body.passphrase);

    return this.prisma.passphrase.create({
      data: {
        passphrase: encryptedPassphrase,
        simhash,
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
    const encryptedPassphrase = this.crypto.encrypt(body.passphrase);
    const simhash = this.crypto.generateSimhash(body.passphrase);

    return this.prisma.passphrase.update({
      where: { id },
      data: {
        passphrase: encryptedPassphrase,
        simhash,
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
      select: { simhash: true },
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
        passphrase: this.crypto.decrypt(entry.passphrase),
        distance: this.crypto.calculateSimhashDistance(
          entry.simhash,
          targetPassphrase.simhash,
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

    const decryptedPassphrase = this.crypto.decrypt(
      existingPassphrase.passphrase,
    );
    return decryptedPassphrase !== newPassphrase;
  }
}
