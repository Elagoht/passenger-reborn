import { BadRequestException, Injectable } from '@nestjs/common';
import { WordlistStatus } from '@prisma/client';
import { join } from 'path';
import { GitService } from 'src/utilities/Git/git.service';
import { PrismaService } from 'src/utilities/Prisma/prisma.service';
import { ResponseWordListCard } from './schemas/responses/wordlists';

@Injectable()
export class WordListsService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly git: GitService,
  ) {}

  public async getWordLists(): Promise<ResponseWordListCard[]> {
    const wordLists = await this.prisma.wordlist.findMany({
      select: {
        id: true,
        displayName: true,
        description: true,
        status: true,
        year: true,
        size: true,
        sizeUnits: true,
        minLength: true,
        maxLength: true,
        totalPasswords: true,
      },
    });

    return wordLists.map((wordList) => {
      return {
        ...wordList,
        sizeUnits: undefined,
        size: `${wordList.size} ${wordList.sizeUnits}`,
      };
    });
  }

  public async getWordList(id: string) {
    return this.prisma.wordlist.findUniqueOrThrow({ where: { id } });
  }

  public async downloadWordList(id: string) {
    const wordList = await this.prisma.wordlist.findUniqueOrThrow({
      where: { id },
    });

    if (
      wordList.status !== WordlistStatus.IMPORTED &&
      wordList.status !== WordlistStatus.FAILED
    ) {
      throw new BadRequestException('Word list already downloading');
    }

    const metadata = await this.getOnlineRepositoryMetadata(
      wordList.repositoryUrl,
    );

    await this.prisma.wordlist.update({
      where: { id },
      data: {
        status: WordlistStatus.DOWNLOADING,
        message: `Download started at ${new Date().toISOString()}`,
      },
    });

    try {
      await this.downloadOnlineRepository(wordList.repositoryUrl, metadata);
    } catch (error) {
      await this.prisma.wordlist.update({
        where: { id },
        data: {
          status: WordlistStatus.FAILED,
          message:
            error instanceof Error
              ? error.message
              : 'Unknown error during download',
        },
      });
    }

    await this.prisma.wordlist.update({
      where: { id },
      data: {
        status: WordlistStatus.DOWNLOADED,
        message: `Download completed at ${new Date().toISOString()}`,
      },
    });
  }

  public async deleteWordList(id: string) {
    const wordList = await this.prisma.wordlist.findUniqueOrThrow({
      where: { id },
      select: { slug: true },
    });

    await this.prisma.wordlist.delete({ where: { id } });
    void this.git.deleteRepository(join('wordlists', wordList.slug));
  }

  public async importWordList(url: string) {
    await this.checkOnlineRepository(url);
    const metadata = await this.getOnlineRepositoryMetadata(url);
    await this.checkCollision(metadata);

    return await this.prisma.wordlist.create({
      data: {
        ...metadata,
        displayName: metadata.displayName,
        slug: metadata.slug,
        adaptedBy: metadata.adaptedBy,
        description: metadata.description,
        minLength: metadata.minLength,
        maxLength: metadata.maxLength,
        totalFiles: metadata.totalFiles,
        year: metadata.year,
        size: metadata.size,
        sizeUnits: metadata.sizeUnits,
        source: metadata.source,
        publishedBy: metadata.publishedBy,
        totalPasswords: metadata.totalPasswords,
        status: WordlistStatus.IMPORTED,
        repositoryUrl: url,
      },
    });
  }

  public async getWordListStatus(id: string) {
    return this.prisma.wordlist.findUniqueOrThrow({
      where: { id },
      select: { status: true, message: true },
    });
  }

  private async checkOnlineRepository(url: string) {
    const isRemoteRepository = await this.git.isRemoteRepository(url);
    if (!isRemoteRepository) {
      throw new BadRequestException('Invalid repository URL');
    }
  }

  private async getOnlineRepositoryMetadata(
    url: string,
  ): Promise<WordListMetadata> {
    const metadataUrl = this.git.getRepositoryRawUrl(url) + '/metadata.json';
    if (!metadataUrl) {
      throw new BadRequestException('Unsupported repository URL');
    }

    console.log(metadataUrl);

    const metaDataResponse = await fetch(metadataUrl);
    const metaData = (await metaDataResponse.json()) as WordListMetadata;

    if (this.METADATA_FIELDS.some((field) => metaData[field] === undefined)) {
      throw new BadRequestException('Invalid metadata');
    }

    console.log(metaData);
    return metaData;
  }

  private async checkCollision(metadata: WordListMetadata) {
    const wordList = await this.prisma.wordlist.findFirst({
      where: { displayName: metadata.displayName },
    });

    if (wordList) {
      throw new BadRequestException('Word list already exists');
    }
  }

  private async downloadOnlineRepository(
    url: string,
    metadata: WordListMetadata,
  ) {
    await this.git.cloneRepository(url, join('wordlists', metadata.slug));
  }

  private async deleteDownloadedRepository(slug: string) {
    await this.git.deleteRepository(join('wordlists', slug));
  }

  private METADATA_FIELDS = [
    'displayName',
    'slug',
    'year',
    'source',
    'description',
    'publishedBy',
    'adaptedBy',
    'minLength',
    'maxLength',
    'totalFiles',
    'totalPasswords',
    'size',
    'sizeUnits',
  ];
}
