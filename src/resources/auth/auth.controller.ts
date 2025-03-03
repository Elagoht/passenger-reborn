import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtGuard } from 'src/utilities/Guards/jwt.guard';
import { AuthService } from './auth.service';
import { RequestChangePassphrase } from './schemas/requests/change';
import RequestInitialize from './schemas/requests/initialize';
import RequestLogin from './schemas/requests/login';
import { RequestResetPassphrase } from './schemas/requests/reset';
import ResponseInitialize from './schemas/responses/initialize';
import { ResponseIsInitialized } from './schemas/responses/is-initialized';
import ResponseToken from './schemas/responses/token';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('is-initialized')
  @ApiOperation({ summary: 'Check if the application has been initialized' })
  @ApiResponse({ type: ResponseIsInitialized })
  async isInitialized() {
    return this.authService.isInitialized();
  }

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize application' })
  @ApiBody({ type: RequestInitialize })
  @ApiResponse({ type: ResponseInitialize })
  @ApiResponse({
    status: 400,
    type: ResponseIsInitialized,
    description: 'Application already initialized',
  })
  async initialize(@Body() body: RequestInitialize) {
    return this.authService.initialize(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Get access token' })
  @ApiBody({ type: RequestLogin })
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: ResponseToken,
  })
  async login(@Body() body: RequestLogin) {
    return this.authService.login(body);
  }

  @Post('reset-passphrase')
  @ApiOperation({ summary: 'Reset passphrase using recovery key' })
  @ApiBody({ type: RequestResetPassphrase })
  @ApiResponse({
    status: 200,
    description: 'Passphrase reset successful',
  })
  async resetPassphrase(@Body() body: RequestResetPassphrase) {
    return this.authService.resetPassphrase(body);
  }

  @Post('change-passphrase')
  @ApiOperation({ summary: 'Change passphrase' })
  @ApiBody({ type: RequestChangePassphrase })
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  async changePassphrase(@Body() body: RequestChangePassphrase) {
    return this.authService.changePassphrase(body);
  }
}
