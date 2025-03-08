import { BadRequestException, Injectable } from '@nestjs/common';
import { WordlistStatus } from '@prisma/client';
import { execSync } from 'child_process';
import { chmod } from 'fs/promises';
import { join } from 'path';
import { cwd } from 'process';
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

    this.checkIfAlreadyDownloaded(wordList.status);

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

    this.checkIfAlreadyDownloaded(status);

    this.checkIfAlreadyDownloading(status);

    // Check if directory already exists
    const repositoryPath = join('wordlists', slug);
    const directoryExists = await this.git.repositoryExists(repositoryPath);

    if (directoryExists) {
      // If directory exists, verify it's a valid git repository
      const isValidRepo = await this.git.isValidRepository(repositoryPath);

      if (isValidRepo) {
        // If directory exists and is valid, update status to DOWNLOADED
        await this.updateStatus(
          id,
          WordlistStatus.DOWNLOADED,
          'Directory already exists and is valid, marked as downloaded',
        );
        return;
      } else {
        // If directory exists but is corrupted, delete it and proceed with download
        await this.git.deleteRepository(repositoryPath);
        await this.updateStatus(
          id,
          WordlistStatus.IMPORTED,
          'Found corrupted repository, deleted it and will proceed with download',
        );
      }
    }

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

  private checkIfAlreadyDownloaded(status: string) {
    if (status === WordlistStatus.DOWNLOADED) {
      throw new BadRequestException('Word list already downloaded');
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

  public async triggerValidateDownloadedRepository(id: string) {
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

    // Fire and forget
    void this.validateDownloadedRepository(id);
    void this.updateStatus(id, WordlistStatus.VALIDATING, 'Validating');
  }

  private async validateDownloadedRepository(id: string) {
    const wordList = await this.prisma.wordlist.findUniqueOrThrow({
      where: { id },
      select: { slug: true, totalFiles: true },
    });

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
      // and if they are text files, set permissions to make them only readable
      // by the owner
      const files = tree.filter((file) => file.startsWith('data/'));
      await Promise.all(
        files.map(async (file) => {
          const regex = /^data\/[0-9]+.ticket$/;
          if (!regex.test(file)) {
            throw new BadRequestException('File does not match format');
          }

          if (
            !this.isPlainText(
              join(cwd(), 'data', 'wordlists', wordList.slug, file),
            )
          ) {
            throw new BadRequestException(`File is not a text file: ${file}`);
          }

          await this.setFilePermissions(
            join(cwd(), 'data', 'wordlists', wordList.slug, file),
          );
        }),
      );

      await this.updateStatus(id, WordlistStatus.VALIDATED, 'Validated');
    } catch (error) {
      await this.updateStatus(id, WordlistStatus.FAILED, 'Failed to validate');
      throw error;
    }
  }

  private isPlainText(filePath: string) {
    try {
      const output = execSync(`file --mime-type -b ${filePath}`)
        .toString()
        .trim();
      return output.startsWith('text/');
    } catch {
      return false;
    }
  }

  private async setFilePermissions(filePath: string) {
    await chmod(filePath, 0o400);
  }
}
