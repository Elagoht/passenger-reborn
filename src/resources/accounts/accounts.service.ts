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
  ResponseAccount,
  ResponseAccountCardItem,
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
  ): Promise<ResponseAccountCardItem[]> {
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
        isPanic: tag.id === this.memCache.get('conf-panicTagId'),
      })),
    }));
  }

  public async getAccountById(id: string): Promise<ResponseAccount> {
    const account = await this.prisma.account.findUniqueOrThrow({
      where: { id },
      select: {
        ...this.selectStandardFields(),
        copiedCount: true,
        lastCopiedAt: true,
        passphrase: true,
      },
    });

    await this.prisma.account.update({
      where: { id },
      data: {
        copiedCount: { increment: 1 },
        lastCopiedAt: new Date(),
      },
    });

    return {
      ...account,
      passphrase: this.crypto.decrypt(account.passphrase),
      tags: account.tags.map((tag) => ({
        ...tag,
        isPanic: tag.id === this.memCache.get('conf-panicTagId'),
      })),
    };
  }

  public async createAccount(body: RequestCreateAccount): Promise<ResponseId> {
    // Calculate the strength score once to ensure consistency
    const strengthScore = Strength.evaluate(body.passphrase).score;

    const account = await this.prisma.account.create({
      data: {
        passphrase: this.crypto.encrypt(body.passphrase),
        simHash: this.crypto.generateSimhash(body.passphrase),
        platform: body.platform,
        identity: body.identity,
        url: body.url,
        note: body.note,
        history: { create: { strength: strengthScore } },
        tags: body.tags
          ? { connect: body.tags.map((tag) => ({ id: tag })) }
          : undefined,
      },
      select: { id: true },
    });

    // Update the strength cache outside the transaction
    await this.graphCache.onRecordCreated(strengthScore, new Date());

    return account;
  }

  public async updateAccount(id: string, body: RequestUpdateAccount) {
    const existingAccount = await this.prisma.account.findUniqueOrThrow({
      where: { id },
      select: { platform: true, identity: true, url: true, note: true },
    });

    // Delete non-updated fields
    Object.keys(existingAccount).forEach((key) => {
      if (existingAccount[key] === body[key]) {
        delete body[key];
      }
    });

    if (!body.passphrase) {
      await this.updateAccountDataWithoutPassphrase(id, body);
      return;
    }

    if (await this.shouldUpdateHistory(id, body.passphrase)) {
      return await this.updateAccountWithNewPassphrase(
        id,
        body.passphrase,
        body,
      );
    }

    await this.updateAccountDataWithoutPassphrase(id, body);
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
        isPanic: tag.id === this.memCache.get('conf-panicTagId'),
      })),
    }));
  }

  public async deleteAccount(id: string): Promise<void> {
    const account = await this.prisma.account.findUniqueOrThrow({
      where: { id },
      select: {
        history: {
          select: { strength: true, id: true },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    await this.prisma.account.delete({ where: { id } });

    // Soft delete the last history record
    await this.prisma.passphraseHistory.update({
      where: { id: account.history[0].id },
      data: { deletedAt: new Date() },
    });

    // Mark the record as deleted and disable for future updates
    await this.graphCache.onRecordDeleted(
      account.history[0].strength,
      new Date(),
    );
  }

  public async addTagToAccount(accountId: string, tagId: string) {
    await this.prisma.account.update({
      where: { id: accountId },
      data: { tags: { connect: { id: tagId } } },
      include: { tags: true },
    });
  }

  public async removeTagFromAccount(accountId: string, tagId: string) {
    await this.prisma.account.update({
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

    const valueToDecrypt = existingAccount.passphrase;

    if (!valueToDecrypt) throw new Error('No value to decrypt');

    const decryptedValue = this.crypto.decrypt(valueToDecrypt);

    return decryptedValue !== newPassphrase;
  }

  private selectTagFields() {
    return {
      select: {
        id: true,
        name: true,
        color: true,
        icon: true,
      },
    };
  }

  private selectStandardFields() {
    return {
      id: true,
      platform: true,
      identity: true,
      url: true,
      note: true,
      tags: this.selectTagFields(),
    };
  }

  private async updateAccountWithNewPassphrase(
    id: string,
    passphrase: string,
    body: RequestUpdateAccount,
  ) {
    const strength = Strength.evaluate(passphrase).score;
    const { updatedAccount, lastHistory } = await this.prisma.$transaction(
      async (prisma) => {
        // Find the last history record
        const lastHistory = await prisma.passphraseHistory.findFirstOrThrow({
          where: { accountId: id },
          orderBy: { createdAt: 'desc' },
        });

        const updatedAccount = await prisma.account.update({
          where: { id },
          data: {
            platform: body.platform,
            identity: body.identity,
            url: body.url,
            note: body.note,
            passphrase: this.crypto.encrypt(passphrase),
            simHash: this.crypto.generateSimhash(passphrase),
            history: {
              create: { strength },
              updateMany: {
                // Soft delete the last history record
                where: { deletedAt: null },
                data: { deletedAt: new Date() },
              },
            },
            tags: body.addTags
              ? { connect: body.addTags.map((tag) => ({ id: tag })) }
              : body.removeTags
                ? { disconnect: body.removeTags.map((tag) => ({ id: tag })) }
                : undefined,
          },
        });
        return { updatedAccount, lastHistory };
      },
    );

    // Move cache updates outside of the transaction
    const now = new Date();
    await this.graphCache.onRecordDeleted(lastHistory.strength, now);
    await this.graphCache.onRecordCreated(strength, now);

    return updatedAccount;
  }

  public async getAccountPassphrase(id: string): Promise<ResponsePassphrase> {
    const account = await this.prisma.account.update({
      where: { id },
      data: {
        copiedCount: { increment: 1 },
        lastCopiedAt: new Date(),
      },
      select: { passphrase: true, copiedCount: true, lastCopiedAt: true },
    });

    return {
      passphrase: this.crypto.decrypt(account.passphrase),
      copiedCount: account.copiedCount,
    };
  }

  private async updateAccountDataWithoutPassphrase(
    id: string,
    body: RequestUpdateAccount,
  ) {
    return await this.prisma.account.update({
      where: { id },
      data: {
        platform: body.platform,
        identity: body.identity,
        url: body.url,
        note: body.note,
        tags: body.addTags
          ? { connect: body.addTags.map((tag) => ({ id: tag })) }
          : body.removeTags
            ? { disconnect: body.removeTags.map((tag) => ({ id: tag })) }
            : undefined,
      },
    });
  }
}
