import { BadRequestException, Injectable, UploadedFile } from '@nestjs/common';
import { exec } from 'child_process';
import { PrismaService } from 'src/utilities/Prisma/prisma.service';
import { promisify } from 'util';

@Injectable()
export class TransferService {
  constructor(private readonly prisma: PrismaService) {}

  public async import(@UploadedFile() file: Express.Multer.File) {
    await this.ensureFileIsCsv(file);

    return {
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  private async ensureFileIsCsv(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const execAsync = promisify(exec);
    const { stdout } = await execAsync(`file -b --mime-type ${file.path}`);
    if (stdout.trim() !== 'text/csv') {
      throw new BadRequestException('Only CSV files are allowed');
    }
  }

  public async export() {}
}
