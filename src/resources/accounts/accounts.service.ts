import { Injectable } from '@nestjs/common';
import { ResponseId } from 'src/utilities/Common/schemas/id';
import { CryptoService } from 'src/utilities/Crypto/crypto.service';
import { GraphCacheService } from 'src/utilities/GraphCache/graph-cache.service';
import { MemCacheService } from 'src/utilities/MemCache/memcache.service';
import Pagination from 'src/utilities/Pagination';
import { PrismaService } from 'src/utilities/Prisma/prisma.service';
import { Strength } from 'src/utilities/Strength';
import RequestCreateAccount from './schemas/requests/create';
import RequestUpdateAccount from './schemas/requests/update';
import {
  ResponseAccountItem,
  ResponseAccountSimilar,
} from './schemas/responses/accounts';
import { ResponsePassphrase } from './schemas/responses/passphrase';

@Injectable()
export class AccountsService {
  private static readonly DEFAULT_SIMILARITY_THRESHOLD = 3;

  public constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly graphCache: GraphCacheService,
    private readonly memCache: MemCacheService,
  ) {}

  public async getAccounts(
    paginationParams: PaginationParams,
  ): Promise<ResponseAccountItem[]> {
    const pagination = new Pagination(paginationParams);

    const accounts = await this.prisma.account.findMany({
      ...pagination.getQuery(),
      ...pagination.sortOldestAdded(),
      select: this.selectStandardFields(),
    });

    return accounts.map((account) => ({
      ...account,
      tags: account.tags.map((tag) => ({
        ...tag,
        isPanic: tag.id === this.memCache.get('panicTagId') ? true : undefined,
      })),
    }));
  }

  public async getAccountById(id: string): Promise<ResponseAccountItem> {
    const account = await this.prisma.account.findUniqueOrThrow({
      where: { id },
      select: this.selectStandardFields(),
    });

    return {
      ...account,
      tags: account.tags.map((tag) => ({
        ...tag,
        isPanic: tag.id === this.memCache.get('panicTagId') ? true : undefined,
      })),
    };
  }

  public async createAccount(body: RequestCreateAccount): Promise<ResponseId> {
    const result = await this.prisma.$transaction(async (prisma) => {
      const account = await prisma.account.create({
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

      // Update the strength cache
      await this.graphCache.onRecordCreated(
        Strength.evaluate(body.passphrase).score,
        new Date(),
      );

      return account;
    });

    return result;
  }

  public async updateAccount(
    id: string,
    body: RequestUpdateAccount,
  ): Promise<void> {
    /**
     * If the passphrase is not provided
     * we can just update the account
     * Trying to escape extra database calls
     */
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
      select: { simHash: true, ...this.selectStandardFields() },
    });

    const similarAccounts = allAccounts
      .map((entry) => ({
        distance: this.crypto.calculateSimhashDistance(
          targetPassphrase.simHash,
          entry.simHash,
        ),
        ...entry,
      }))
      .filter((entry) => entry.distance <= threshold);

    return similarAccounts.map((account) => ({
      ...account,
      tags: account.tags.map((tag) => ({
        ...tag,
        isPanic: tag.id === this.memCache.get('panicTagId') ? true : undefined,
      })),
    }));
  }

  public async deleteAccount(id: string): Promise<void> {
    await this.prisma.$transaction(async (prisma) => {
      const account = await prisma.account.delete({
        where: { id },
        select: {
          history: {
            select: { strength: true, id: true },
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      // Soft delete the last history record
      await prisma.passphraseHistory.update({
        where: { id: account.history[0].id },
        data: { deletedAt: new Date() },
      });

      // Mark the record as deleted and disable for future updates
      await this.graphCache.onRecordDeleted(
        account.history[0].strength,
        new Date(),
      );
    });
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
    await this.prisma.$transaction(async (prisma) => {
      // Find the last history record
      const lastHistory = await prisma.passphraseHistory.findFirstOrThrow({
        where: { accountId: id, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });

      const strength = Strength.evaluate(passphrase).score;
      await prisma.account.update({
        where: { id },
        data: {
          passphrase: this.crypto.encrypt(passphrase),
          simHash: this.crypto.generateSimhash(passphrase),
          platform: body.platform,
          note: body.note,
          icon: body.icon,
          history: {
            create: { strength },
            updateMany: {
              // Soft delete the last history record
              where: { deletedAt: null },
              data: { deletedAt: new Date() },
            },
          },
        },
      });

      // Update the strength cache
      const now = new Date();
      await this.graphCache.onRecordDeleted(lastHistory.strength, now);
      await this.graphCache.onRecordCreated(strength, now);
    });
  }

  public async getAccountPassphrase(id: string): Promise<ResponsePassphrase> {
    const account = await this.prisma.account.findUniqueOrThrow({
      where: { id },
      select: { passphrase: true },
    });

    return { passphrase: this.crypto.decrypt(account.passphrase) };
  }
}
