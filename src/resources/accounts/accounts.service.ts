import { Injectable, NotFoundException } from '@nestjs/common';
import { Account, PassphraseHistory } from '@prisma/client';
import { CryptoService } from 'src/utilities/Crypto';
import { PrismaService } from 'src/utilities/Prisma';
import { Strength } from 'src/utilities/Strength';
import RequestCreateAccount from './schemas/requests/create';
import RequestUpdateAccount from './schemas/requests/update';

@Injectable()
export class AccountsService {
  private static readonly DEFAULT_SIMILARITY_THRESHOLD = 3;

  public constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  public async getAccounts(): Promise<Account[]> {
    const entries = await this.prisma.account.findMany();
    return entries.map((entry) => ({
      ...entry,
      passphrase: this.crypto.decrypt(entry.passphrase),
    }));
  }

  public async getAccountById(
    id: string,
  ): Promise<Account & { history: PassphraseHistory[] }> {
    const entry = await this.prisma.account.findUniqueOrThrow({
      where: { id },
      include: { history: true },
    });

    return {
      ...entry,
      passphrase: this.crypto.decrypt(entry.passphrase),
    };
  }

  public async createAccount(body: RequestCreateAccount) {
    const strength = Strength.evaluate(body.passphrase).score;
    const encryptedPassphrase = this.crypto.encrypt(body.passphrase);
    const simhash = this.crypto.generateSimhash(body.passphrase);

    return this.prisma.account.create({
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

  public async updateAccount(id: string, body: RequestUpdateAccount) {
    if (!body.passphrase) {
      return this.prisma.account.update({
        where: { id },
        data: {
          platform: body.platform,
          note: body.note,
          icon: body.icon,
        },
      });
    }

    const shouldUpdate = await this.shouldUpdateAccount(id, body.passphrase);
    if (!shouldUpdate) {
      return this.prisma.account.update({
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

    return this.prisma.account.update({
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

  public async getSimilarAccounts(
    id: string,
    threshold = AccountsService.DEFAULT_SIMILARITY_THRESHOLD,
  ) {
    const targetPassphrase = await this.prisma.account.findUnique({
      where: { id },
      select: { simhash: true },
    });

    if (!targetPassphrase) {
      throw new NotFoundException('Account not found');
    }

    const allAccounts = await this.prisma.account.findMany({
      where: { id: { not: id } },
    });

    return allAccounts
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

  public async deleteAccount(id: string): Promise<void> {
    await this.prisma.account.delete({ where: { id } });
  }

  private async shouldUpdateAccount(
    id: string,
    newPassphrase: string,
  ): Promise<boolean> {
    const existingAccount = await this.prisma.account.findUnique({
      where: { id },
      select: { passphrase: true },
    });

    if (!existingAccount) {
      throw new NotFoundException('Account not found');
    }

    const decryptedPassphrase = this.crypto.decrypt(existingAccount.passphrase);
    return decryptedPassphrase !== newPassphrase;
  }
}
