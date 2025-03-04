import { Injectable, NotFoundException } from '@nestjs/common';
import { CryptoService } from 'src/utilities/Crypto';
import Pagination from 'src/utilities/Pagination';
import { PrismaService } from 'src/utilities/Prisma';
import { Strength } from 'src/utilities/Strength';
import RequestCreateAccount from './schemas/requests/create';
import RequestUpdateAccount from './schemas/requests/update';
import {
  ResponseAccountDetails,
  ResponseAccountItem,
} from './schemas/responses/accounts';

@Injectable()
export class AccountsService {
  private static readonly DEFAULT_SIMILARITY_THRESHOLD = 3;

  public constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  public async getAccounts(
    paginationParams: PaginationParams,
  ): Promise<ResponseAccountItem[]> {
    const pagination = new Pagination(paginationParams);

    return await this.prisma.account.findMany({
      ...pagination.getQuery(),
      ...pagination.sortOldestAdded(),
      select: this.selectStandardFields(),
    });
  }

  public async getAccountById(id: string): Promise<ResponseAccountDetails> {
    return await this.prisma.account.findUniqueOrThrow({
      where: { id },
      select: {
        ...this.selectStandardFields(),
        history: {
          select: { strength: true, createdAt: true, deletedAt: true },
        },
      },
    });
  }

  public async createAccount(body: RequestCreateAccount) {
    const strength = Strength.evaluate(body.passphrase).score;
    const encryptedPassphrase = this.crypto.encrypt(body.passphrase);
    const simHash = this.crypto.generateSimhash(body.passphrase);

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
    // If the passphrase is not provided, we can just update the account
    if (!body.passphrase) {
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

    // If the passphrase has changed, we need to update the account
    if (await this.shouldUpdateHistory(id, body.passphrase)) {
      await this.updateAccountWithNewPassphrase(id, body.passphrase, body);
    }

    // Otherwise, we just update the account
    return this.prisma.account.update({
      where: { id },
      data: { platform: body.platform, note: body.note, icon: body.icon },
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

  private async shouldUpdateHistory(
    id: string,
    newPassphrase: string,
  ): Promise<boolean> {
    const existingAccount = await this.prisma.account.findUniqueOrThrow({
      where: { id },
      select: { passphrase: true },
    });

    return this.crypto.decrypt(existingAccount.passphrase) !== newPassphrase;
  }

  private selectTagFields() {
    return {
      select: {
        id: true,
        name: true,
        icon: true,
        color: true,
      },
    };
  }

  private selectStandardFields() {
    return {
      id: true,
      platform: true,
      url: true,
      note: true,
      icon: true,
      tags: this.selectTagFields(),
    };
  }

  private async updateAccountWithNewPassphrase(
    id: string,
    passphrase: string,
    body: RequestUpdateAccount,
  ) {
    return this.prisma.account.update({
      where: { id },
      data: {
        passphrase: this.crypto.encrypt(passphrase),
        simHash: this.crypto.generateSimhash(passphrase),
        platform: body.platform,
        note: body.note,
        icon: body.icon,
        history: {
          create: { strength: Strength.evaluate(passphrase).score },
        },
      },
    });
  }
}
