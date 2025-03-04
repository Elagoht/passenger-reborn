import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Account, PassphraseHistory } from '@prisma/client';
import { CryptoService } from 'src/utilities/Crypto';
import Pagination from 'src/utilities/Pagination';
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

  public async getAccounts(
    paginationParams: PaginationParams,
  ): Promise<Account[]> {
    const pagination = new Pagination(paginationParams);

    const entries = await this.prisma.account.findMany({
      ...pagination.getQuery(),
      ...pagination.sortOldestAdded(),
    });

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
    const simHash = this.crypto.generateSimhash(body.passphrase);

    await this.validateAccountDoesNotExist(
      body.platform,
      body.url,
      encryptedPassphrase,
    );

    return this.prisma.account.create({
      data: {
        passphrase: encryptedPassphrase,
        simHash,
        platform: body.platform,
        url: body.url,
        note: body.note,
        icon: body.icon,
        history: { create: { strength } },
      },
    });
  }

  public async updateAccount(id: string, body: RequestUpdateAccount) {
    const currentAccount = await this.prisma.account.findUniqueOrThrow({
      where: { id },
    });

    if (!body.passphrase) {
      await this.validateAccountDoesNotExist(
        body.platform ?? currentAccount.platform,
        body.url ?? currentAccount.url,
        body.passphrase ?? currentAccount.passphrase,
      );

      return this.prisma.account.update({
        where: { id },
        data: {
          platform: body.platform,
          url: body.url,
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
    const simHash = this.crypto.generateSimhash(body.passphrase);

    return this.prisma.account.update({
      where: { id },
      data: {
        passphrase: encryptedPassphrase,
        simHash,
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
      select: { simHash: true },
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
          entry.simHash,
          targetPassphrase.simHash,
        ),
      }))
      .filter((entry) => entry.distance <= threshold);
  }

  public async deleteAccount(id: string): Promise<void> {
    await this.prisma.account.delete({ where: { id } });
  }

  public async addTagToAccount(accountId: string, tagId: string) {
    return this.prisma.account.update({
      where: { id: accountId },
      data: { tags: { connect: { id: tagId } } },
      include: { tags: true },
    });
  }

  public async removeTagFromAccount(accountId: string, tagId: string) {
    return this.prisma.account.update({
      where: { id: accountId },
      data: { tags: { disconnect: { id: tagId } } },
      include: { tags: true },
    });
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

  private async validateAccountDoesNotExist(
    platform: string,
    url: string,
    passphrase: string,
  ) {
    const existingAccount = await this.prisma.account.findFirst({
      where: {
        platform,
        url,
        passphrase: this.crypto.encrypt(passphrase),
      },
    });

    if (existingAccount) {
      throw new BadRequestException('Account already exists');
    }
  }
}
