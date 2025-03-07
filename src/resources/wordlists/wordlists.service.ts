import { BadRequestException, Injectable } from '@nestjs/common';
import { WordlistStatus } from '@prisma/client';
import { join } from 'path';
import { GitService } from 'src/utilities/Git/git.service';
import { PrismaService } from 'src/utilities/Prisma/prisma.service';
import {
  ResponseWordList,
  ResponseWordListCard,
} from './schemas/responses/wordlists';

@Injectable()
export class WordListsService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly git: GitService,
  ) {}

  public async getWordLists(): Promise<ResponseWordListCard[]> {
    return this.prisma.wordlist.findMany({
      select: {
        id: true,
        displayName: true,
        description: true,
        status: true,
        year: true,
        size: true,
        sizeUnits: true,
        totalPasswords: true,
      },
    });
  }

  public async getWordList(id: string): Promise<ResponseWordList> {
    const wordList = await this.prisma.wordlist.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        displayName: true,
        description: true,
        status: true,
        year: true,
        minLength: true,
        maxLength: true,
        totalFiles: true,
        slug: true,
        repository: true,
        source: true,
        publishedBy: true,
        adaptedBy: true,
        message: true,
        totalPasswords: true,
        size: true,
        sizeUnits: true,
        _count: { select: { analyses: true } },
      },
    });

    const { _count, ...rest } = wordList;
    return { ...rest, analysesCount: _count.analyses };
  }

  public async cancelWordListDownload(id: string) {
    const wordList = await this.prisma.wordlist.findUniqueOrThrow({
      where: { id },
      select: { status: true, slug: true },
    });

    if (wordList.status !== WordlistStatus.DOWNLOADING) {
      throw new BadRequestException('Word list is not currently downloading');
    }

    const repositoryPath = join('wordlists', wordList.slug);
    const canceled = await this.git.cancelClone(repositoryPath);

    if (canceled) {
      await this.updateStatus(id, WordlistStatus.IMPORTED, 'Download canceled');
    } else {
      throw new BadRequestException('Failed to cancel download');
    }
  }

  public async downloadWordList(id: string) {
    const { status, repository, slug } =
      await this.prisma.wordlist.findUniqueOrThrow({
        where: { id },
        select: { status: true, repository: true, slug: true },
      });

    this.checkIfAlreadyDownloading(status);

    await this.updateStatus(id, WordlistStatus.DOWNLOADING, 'Download started');

    try {
      this.triggerDownloadOnlineRepository(repository, slug, id);
    } catch {
      await this.updateStatus(id, WordlistStatus.FAILED, 'Failed to download');
      return;
    }
  }

  public async deleteWordList(id: string) {
    const wordList = await this.prisma.wordlist.findUniqueOrThrow({
      where: { id },
      select: { slug: true },
    });

    await this.prisma.wordlist.delete({ where: { id } });
    void this.deleteDownloadedRepository(wordList.slug);
  }

  public async importWordList(url: string) {
    const metadata = await this.getOnlineRepositoryMetadata(url);

    return await this.prisma.wordlist.create({
      data: {
        ...metadata,
        status: WordlistStatus.IMPORTED,
        message: `[${new Date().toISOString()}] Imported`,
      },
    });
  }

  public async getWordListStatus(id: string) {
    return this.prisma.wordlist.findUniqueOrThrow({
      where: { id },
      select: { status: true, message: true },
    });
  }

  private async updateStatus(
    id: string,
    status: WordlistStatus,
    message: string,
  ) {
    await this.prisma.wordlist.update({
      where: { id },
      data: { status, message: `[${new Date().toISOString()}] ${message}` },
    });
  }

  private checkIfAlreadyDownloading(status: WordlistStatus) {
    if (
      status !== WordlistStatus.IMPORTED &&
      status !== WordlistStatus.FAILED
    ) {
      throw new BadRequestException('Word list already downloading');
    }
  }

  private async getOnlineRepositoryMetadata(
    url: string,
  ): Promise<WordListMetadata> {
    const metaDataResponse = await fetch(url);

    let metaData: WordListMetadata | undefined;
    try {
      metaData = (await metaDataResponse.json()) as WordListMetadata;
    } catch {
      throw new BadRequestException('Could not validate JSON metadata');
    }

    const missingFields = this.METADATA_FIELDS.filter(
      (field) => metaData[field] === undefined,
    );

    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Missing required fields: ${missingFields.join(', ')}`,
      );
    }

    return metaData;
  }

  private triggerDownloadOnlineRepository(
    url: string,
    slug: string,
    id: string,
  ) {
    this.git.cloneRepository(
      url,
      join('wordlists', slug),
      () => {
        void this.updateStatus(id, WordlistStatus.DOWNLOADED, 'Downloaded');
      },
      () => {
        void this.updateStatus(id, WordlistStatus.FAILED, 'Failed downloading');
      },
    );
  }

  private async deleteDownloadedRepository(slug: string) {
    await this.git.deleteRepository(join('wordlists', slug));
  }

  private METADATA_FIELDS: Array<keyof WordListMetadata> = [
    'displayName',
    'slug',
    'year',
    'source',
    'repository',
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

  public async validateDownloadedRepository(id: string) {
    const wordList = await this.prisma.wordlist.findUniqueOrThrow({
      where: { id },
      select: { status: true, slug: true, totalFiles: true },
    });

    if (
      (
        [
          WordlistStatus.UNVALIDATED,
          WordlistStatus.VALIDATING,
          WordlistStatus.DOWNLOADING,
          WordlistStatus.IMPORTED,
          WordlistStatus.ANALYZING,
        ] as WordlistStatus[]
      ).includes(wordList.status)
    ) {
      throw new BadRequestException('Cannot start a validation at the moment');
    }

    void this.updateStatus(id, WordlistStatus.VALIDATING, 'Validating');

    try {
      let tree: string[] | undefined;
      try {
        tree = await this.git.getFileTree(join('wordlists', wordList.slug));
      } catch {
        await this.updateStatus(id, WordlistStatus.FAILED, 'Could not trigger');
        throw new BadRequestException(
          'Directory not found, did the download succeed?',
        );
      }

      // Check if there is a data/ directory
      if (!tree.includes('data')) {
        throw new BadRequestException('Data directory not found');
      }

      // Check if the total number of files matches the metadata
      const totalFiles = tree.filter((file) => file.startsWith('data/')).length;

      if (totalFiles !== wordList.totalFiles) {
        throw new BadRequestException('Total files do not match metadata');
      }

      // Check if all files under data/ named like {number}.ticket are valid
      const files = tree.filter((file) => file.startsWith('data/'));
      for (const file of files) {
        const regex = /^data\/[0-9]+.ticket$/;
        if (!regex.test(file)) {
          throw new BadRequestException('File does not match format');
        }
      }

      await this.updateStatus(id, WordlistStatus.VALIDATED, 'Validated');
    } catch (error) {
      await this.updateStatus(id, WordlistStatus.FAILED, 'Failed to validate');
      throw error;
    }
  }
}
