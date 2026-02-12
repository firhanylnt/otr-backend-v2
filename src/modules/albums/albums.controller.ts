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
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AlbumsService } from './albums.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('Albums')
@Controller('albums')
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new album' })
  async create(@Body() data: any, @Request() req) {
    return this.albumsService.create(data, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all albums' })
  async findAll(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.albumsService.findAll({ status, type, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get album by ID' })
  async findOne(@Param('id') id: string) {
    return this.albumsService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get album by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.albumsService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an album' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.albumsService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an album' })
  async remove(@Param('id') id: string) {
    return this.albumsService.remove(id);
  }
}

