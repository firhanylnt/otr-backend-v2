import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MoodsService } from './moods.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { Mood } from '../../entities/mood.entity';

@ApiTags('Moods')
@Controller('moods')
export class MoodsController {
  constructor(private readonly moodsService: MoodsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new mood' })
  async create(@Body() data: Partial<Mood>) {
    return this.moodsService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all moods' })
  async findAll(@Query('includeInactive') includeInactive?: boolean) {
    return this.moodsService.findAll(includeInactive);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get mood by ID' })
  async findOne(@Param('id') id: string) {
    return this.moodsService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get mood by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.moodsService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a mood' })
  async update(@Param('id') id: string, @Body() data: Partial<Mood>) {
    return this.moodsService.update(id, data);
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle mood active status' })
  async toggleActive(@Param('id') id: string) {
    return this.moodsService.toggleActive(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a mood' })
  async remove(@Param('id') id: string) {
    return this.moodsService.remove(id);
  }
}

