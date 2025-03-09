import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CsvImportFileInterceptor } from 'src/interceptors/csv-import-file.interceptor';
import { ExportFormat } from './schemas/requests/export';
import { ImportConflictHandling } from './schemas/requests/import';
import {
  ImportResponseConflict,
  ImportResponseSuccess,
} from './schemas/responses/import';
import { TransferService } from './transfer.service';

@Controller('transfer')
@ApiTags('Transfer')
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Post('import')
  @ApiOperation({ summary: 'Import data from CSV file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'CSV file to import',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file containing account data',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Import successful',
    type: ImportResponseSuccess,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicting accounts',
    type: ImportResponseConflict,
  })
  @ApiQuery({
    name: 'strategy',
    enum: ImportConflictHandling,
    required: false,
    default: ImportConflictHandling.THROW,
  })
  @UseInterceptors(CsvImportFileInterceptor)
  import(
    @UploadedFile() file: Express.Multer.File,
    @Query() query: { strategy: ImportConflictHandling },
  ) {
    return this.transferService.import(file, query.strategy);
  }

  @Post('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export data to CSV format' })
  @ApiQuery({
    name: 'format',
    enum: ExportFormat,
    description: 'Format to export data to',
    required: true,
    example: ExportFormat.CHROME,
  })
  @ApiResponse({
    status: 200,
    description: 'Export successful',
    schema: {
      type: 'string',
      format: 'text/csv',
      description: 'CSV file containing exported account data',
    },
  })
  export(@Query('format') format: ExportFormat) {
    return this.transferService.export(format);
  }
}
