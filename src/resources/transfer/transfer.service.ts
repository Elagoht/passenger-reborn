import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { exec } from 'child_process';
import { rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { CryptoService } from 'src/utilities/Crypto/crypto.service';
import CSV from 'src/utilities/CSV';
import OnePasswordCSVExporter from 'src/utilities/CSVExporter/1PasswordCSVExporter';
import ChromiumCSVExporter from 'src/utilities/CSVExporter/ChromiumCSVExporter';
import FirefoxCSVExporter from 'src/utilities/CSVExporter/FirefoxCSVExporter';
import LastPassCSVExporter from 'src/utilities/CSVExporter/LastPassCSVExporter';
import CSVImporter from 'src/utilities/CSVImporter';
import OnePasswordCSVImporter from 'src/utilities/CSVImporter/1PasswordCSVImporter';
import ChromeCSVImporter from 'src/utilities/CSVImporter/ChromiumCSVImporter';
import FirefoxCSVImporter from 'src/utilities/CSVImporter/FirefoxCSVImporter';
import LastPassCSVImporter from 'src/utilities/CSVImporter/LastPassCSVImporter';
import { PrismaService } from 'src/utilities/Prisma/prisma.service';
import { promisify } from 'util';
import RequestCreateAccount from '../accounts/schemas/requests/create';
import { ExportFormat } from './schemas/requests/export';
import { ImportConflictHandling } from './schemas/requests/import';

@Injectable()
export class TransferService {
  private readonly importers = {
    Firefox: FirefoxCSVImporter,
    Chrome: ChromeCSVImporter,
    LastPass: LastPassCSVImporter,
    OnePassword: OnePasswordCSVImporter,
  } as const;

  private readonly exporters = {
    [ExportFormat.FIREFOX]: FirefoxCSVExporter,
    [ExportFormat.CHROME]: ChromiumCSVExporter,
    [ExportFormat.LASTPASS]: LastPassCSVExporter,
    [ExportFormat.ONEPASSWORD]: OnePasswordCSVExporter,
  } as const;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
  ) {}

  public async import(
    file: Express.Multer.File,
    strategy: ImportConflictHandling = ImportConflictHandling.THROW,
  ) {
    await this.ensureFileIsCsv(file);

    const csv = new CSV(file.buffer.toString(), { lineBreak: '\r' });
    const importer = this.detectImporter(csv);
    const requests = importer.getImportedRequests();
    return this.processImportRequests(requests, strategy);
  }

  public async export(format: ExportFormat) {
    const accounts = await this.prisma.account.findMany();

    // Decrypt the passphrases
    const decryptedAccounts = accounts.map((account) => ({
      ...account,
      passphrase: this.cryptoService.decrypt(account.passphrase),
    }));

    // Get the appropriate exporter
    const ExporterClass = this.exporters[format];
    if (!ExporterClass) {
      throw new BadRequestException(`Unsupported export format: ${format}`);
    }

    // Create the exporter and export the data
    const exporter = new ExporterClass(decryptedAccounts);
    return exporter.export();
  }

  private async processImportRequests(
    requests: RequestCreateAccount[],
    strategy: ImportConflictHandling,
  ): Promise<{ message: string; details: string }> {
    const logs: string[] = [];

    switch (strategy) {
      case ImportConflictHandling.THROW:
        for (const [index, request] of requests.entries()) {
          try {
            await this.createAccount(request);
            logs.push(this.formatLogMessage(request, index + 1, 'success'));
          } catch (error) {
            if (this.isUniqueConstraintError(error)) {
              throw new ConflictException({
                message: 'Conflicting accounts',
                details: this.formatLogMessage(request, index + 1, 'conflict'),
              });
            }
            throw error;
          }
        }
        return { message: 'Import completed', details: logs.join('\n') };

      case ImportConflictHandling.UPDATE:
        for (const [index, request] of requests.entries()) {
          const existingAccount = await this.findExistingAccount(request);
          if (existingAccount) {
            await this.updateExistingAccount(existingAccount.id, request);
            logs.push(this.formatLogMessage(request, index + 1, 'update'));
          } else {
            await this.createAccount(request);
            logs.push(this.formatLogMessage(request, index + 1, 'success'));
          }
        }
        return { message: 'Import completed', details: logs.join('\n') };

      case ImportConflictHandling.SKIP:
        for (const [index, request] of requests.entries()) {
          const existingAccount = await this.findExistingAccount(request);
          if (existingAccount) {
            logs.push(this.formatLogMessage(request, index + 1, 'skip'));
          } else {
            await this.createAccount(request);
            logs.push(this.formatLogMessage(request, index + 1, 'success'));
          }
        }
        return { message: 'Import completed', details: logs.join('\n') };
    }
  }

  private async createAccount(request: RequestCreateAccount): Promise<void> {
    await this.prisma.$transaction(async (prisma) => {
      await prisma.account.create({
        data: this.prepareQueries(request),
      });
    });
  }

  private async findExistingAccount(request: RequestCreateAccount) {
    return this.prisma.account.findFirst({
      where: {
        url: request.url,
        platform: request.platform,
        identity: request.identity,
      },
    });
  }

  private async updateExistingAccount(
    id: string,
    request: RequestCreateAccount,
  ): Promise<void> {
    await this.prisma.account.update({
      where: { id },
      data: this.prepareQueries(request),
    });
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof PrismaClientKnownRequestError && error.code === 'P2002'
    );
  }

  private prepareQueries(request: RequestCreateAccount) {
    return {
      ...request,
      passphrase: this.cryptoService.encrypt(request.passphrase),
      simHash: this.cryptoService.generateSimhash(request.passphrase),
    };
  }

  private async ensureFileIsCsv(file: Express.Multer.File): Promise<void> {
    if (!file) throw new BadRequestException('No file uploaded');

    const tempFilePath = join(tmpdir(), file.originalname);
    await writeFile(tempFilePath, file.buffer);

    try {
      const execAsync = promisify(exec);
      const { stdout } = await execAsync(`file -b --mime-type ${tempFilePath}`);

      if (!['text/csv', 'text/plain'].includes(stdout.trim())) {
        throw new BadRequestException('Only CSV files are allowed');
      }
    } finally {
      await rm(tempFilePath, { force: true, recursive: true });
    }
  }

  private detectImporter(csv: CSV): CSVImporter {
    const headers = new Set(csv.getHeaders());

    for (const [name, Importer] of Object.entries(this.importers)) {
      try {
        const instance = new Importer(csv);
        const requiredHeaders = instance.getRequiredHeaders();

        if (requiredHeaders.every((header) => headers.has(header))) {
          console.log(`Detected importer: ${name}`);
          return instance;
        }
      } catch {
        throw Error();
      }
    }

    throw new BadRequestException('Unsupported CSV format');
  }

  private formatLogMessage(
    request: RequestCreateAccount,
    index: number,
    action: 'success' | 'update' | 'skip' | 'conflict',
  ): string {
    const base = `[Line ${index}]: `;
    const identity = `${request.identity} for ${request.platform} (${request.url})`;

    switch (action) {
      case 'success':
        return `${base}Successfully imported ${identity}`;
      case 'update':
        return `${base}Update to existing account ${identity}`;
      case 'skip':
        return `${base}Skip existing account ${identity}`;
      case 'conflict':
        return `${base}Conflict with existing account ${identity}`;
    }
  }
}
