import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from 'src/guards/jwt.guard';
import { PreferencesService } from './preferences.service';
import { RequestSetPreference } from './schemas/requests/preference';
import { ResponsePreference } from './schemas/responses/preferences';

@Controller('preferences')
@ApiTags('Preferences')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all preferences' })
  @ApiResponse({ type: [ResponsePreference] })
  async getPreferences() {
    return this.preferencesService.getPreferences();
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get a preference by key' })
  @ApiParam({ name: 'key', description: 'The key of the preference' })
  @ApiResponse({ type: ResponsePreference })
  async getPreference(@Param('key') key: string) {
    return this.preferencesService.getPreference(key);
  }

  @Post(':key')
  @ApiOperation({ summary: 'Set a preference by key' })
  @ApiParam({ name: 'key', description: 'The key of the preference' })
  @ApiBody({ type: RequestSetPreference })
  @HttpCode(HttpStatus.OK)
  async setPreference(
    @Param('key') key: string,
    @Body() body: RequestSetPreference,
  ) {
    await this.preferencesService.setPreference(key, body);
  }
}
