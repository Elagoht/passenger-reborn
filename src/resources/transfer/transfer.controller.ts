import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CsvImportFileInterceptor } from 'src/interceptors/csv-import-file.interceptor';
import { TransferService } from './transfer.service';

@Controller('transfer')
@ApiTags('Transfer')
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Post('import')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(CsvImportFileInterceptor)
  import(@UploadedFile() file: Express.Multer.File) {
    return this.transferService.import(file);
  }

  @Post('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export data to CSV format' })
  export() {
    return this.transferService.export();
  }
}
