import { BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

export const CsvImportFileInterceptor = FileInterceptor('file', {
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_, file, callback) => {
    if (file.mimetype !== 'text/csv') {
      return callback(
        new BadRequestException('Only CSV files are allowed'),
        false,
      );
    }
    callback(null, true);
  },
});
