import { Injectable } from '@nestjs/common';
import { ResponseId } from 'src/utilities/Common/schemas/id';
import { CryptoService } from 'src/utilities/Crypto';
import Pagination from 'src/utilities/Pagination';
import { PrismaService } from 'src/utilities/Prisma';
import { Strength } from 'src/utilities/Strength';
import RequestCreateAccount from './schemas/requests/create';
import RequestUpdateAccount from './schemas/requests/update';
import {
  ResponseAccountDetails,
  ResponseAccountItem,
  ResponseAccountSimilar,
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
        ...this.selectHistoryFields(),
      },
    });
  }

  public async createAccount(body: RequestCreateAccount): Promise<ResponseId> {
    return await this.prisma.account.create({
      data: {
        passphrase: this.crypto.encrypt(body.passphrase),
        simHash: this.crypto.generateSimhash(body.passphrase),
        platform: body.platform,
        url: body.url,
        note: body.note,
        icon: body.icon,
        history: {
          create: { strength: Strength.evaluate(body.passphrase).score },
        },
      },
      select: { id: true },
    });
  }

  public async updateAccount(
    id: string,
    body: RequestUpdateAccount,
  ): Promise<void> {
    // If the passphrase is not provided, we can just update the account
    if (!body.passphrase) {
      await this.prisma.account.update({
        where: { id },
        data: {
          platform: body.platform,
          url: body.url,
          note: body.note,
          icon: body.icon,
        },
      });
      return;
    }

    // If the passphrase has changed, we need to update the account
    if (await this.shouldUpdateHistory(id, body.passphrase)) {
      await this.updateAccountWithNewPassphrase(id, body.passphrase, body);
      return;
    }

    // Otherwise, we just update the account
    await this.prisma.account.update({
      where: { id },
      data: { platform: body.platform, note: body.note, icon: body.icon },
    });
  }

  public async getSimilarAccounts(
    id: string,
    threshold = AccountsService.DEFAULT_SIMILARITY_THRESHOLD,
  ): Promise<ResponseAccountSimilar[]> {
    const targetPassphrase = await this.prisma.account.findUniqueOrThrow({
      where: { id },
      select: { simHash: true },
    });

    const allAccounts = await this.prisma.account.findMany({
      where: { id: { not: id } },
      select: {
        simHash: true,
        ...this.selectStandardFields(),
        ...this.selectHistoryFields(),
      },
    });

    return allAccounts
      .map((entry) => ({
        distance: this.crypto.calculateSimhashDistance(
          targetPassphrase.simHash,
          entry.simHash,
        ),
        ...entry,
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

  private selectHistoryFields() {
    return {
      history: {
        select: {
          strength: true,
          createdAt: true,
          deletedAt: true,
        },
      },
    };
  }

  private async updateAccountWithNewPassphrase(
    id: string,
    passphrase: string,
    body: RequestUpdateAccount,
  ) {
    await this.prisma.account.update({
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
