import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import RequestInitialize from './schemas/requests/initialize';
import RequestLogin from './schemas/requests/login';
import ResponseToken from './schemas/responses/token';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize application' })
  @ApiBody({ type: RequestInitialize })
  @ApiResponse({
    status: 200,
    description: 'Application initialized',
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
    return this.authService.login(body.passphrase);
  }
}
