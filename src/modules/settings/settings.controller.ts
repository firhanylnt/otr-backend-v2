import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all settings' })
  async getAll() {
    return this.settingsService.getAll();
  }

  @Get('public/about')
  @ApiOperation({ summary: 'Get public about page settings' })
  async getAboutSettings() {
    return this.settingsService.getAboutSettings();
  }

  @Get(':group')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get settings by group' })
  async getByGroup(@Param('group') group: string) {
    return this.settingsService.getByGroup(group);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update settings' })
  async updateBatch(@Body() settings: { key: string; value: string }[]) {
    return this.settingsService.updateBatch(settings);
  }
}

