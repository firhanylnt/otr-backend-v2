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
import { GenresService } from './genres.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { Genre } from '../../entities/genre.entity';

@ApiTags('Genres')
@Controller('genres')
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new genre' })
  async create(@Body() data: Partial<Genre>) {
    return this.genresService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all genres' })
  async findAll(@Query('includeInactive') includeInactive?: boolean) {
    return this.genresService.findAll(includeInactive);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get genre by ID' })
  async findOne(@Param('id') id: string) {
    return this.genresService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get genre by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.genresService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a genre' })
  async update(@Param('id') id: string, @Body() data: Partial<Genre>) {
    return this.genresService.update(id, data);
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle genre active status' })
  async toggleActive(@Param('id') id: string) {
    return this.genresService.toggleActive(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a genre' })
  async remove(@Param('id') id: string) {
    return this.genresService.remove(id);
  }
}

