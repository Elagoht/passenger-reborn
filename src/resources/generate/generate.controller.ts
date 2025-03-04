import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GenerateService } from './generate.service';
import AlternativeRequest from './schemas/request/alternative';
import GeneratedResponse from './schemas/response/generated';

@Controller('generate')
@ApiTags('Generate')
export class GenerateController {
  constructor(private readonly generateService: GenerateService) {}

  @Get()
  @ApiOperation({
    summary: 'Generate a random passphrase of a given length',
  })
  @ApiQuery({
    name: 'length',
    description: 'The length of the passphrase to generate',
    default: 32,
    required: false,
  })
  @ApiResponse({
    description: 'The generated passphrase',
    type: GeneratedResponse,
  })
  generate(@Query('length') length: number = 32) {
    return this.generateService.passphrase(length);
  }

  @Post('alternative')
  @ApiOperation({
    summary: 'Generate a similar looking but stronger passphrase',
  })
  @ApiBody({ type: AlternativeRequest })
  @ApiResponse({
    description: 'The generated passphrase',
    type: GeneratedResponse,
  })
  alternative(@Body() body: AlternativeRequest) {
    return this.generateService.alternative(body.input);
  }
}
