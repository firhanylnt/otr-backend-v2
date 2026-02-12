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
import { SongsService } from './songs.service';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('Songs')
@Controller('songs')
export class SongsController {
  constructor(private readonly songsService: SongsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a new song' })
  async create(@Body() createSongDto: CreateSongDto, @Request() req) {
    return this.songsService.create(createSongDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all published songs' })
  async findPublished(
    @Query('genre') genre?: string,
    @Query('mood') mood?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.songsService.findPublished({ genre, mood, search, page, limit });
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all songs for admin' })
  async findAll(
    @Query('status') status?: string,
    @Query('genre') genre?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.songsService.findAll({ status, genre, search, page, limit });
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending songs for review' })
  async findPending() {
    return this.songsService.findPending();
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get song statistics' })
  async getStats() {
    return this.songsService.getStats();
  }

  @Get('my-songs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user songs' })
  async getMySongs(
    @Request() req,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.songsService.findAll({
      creatorId: req.user.userId,
      status,
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get song by ID' })
  async findOne(@Param('id') id: string) {
    return this.songsService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get song by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.songsService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a song' })
  async update(
    @Param('id') id: string,
    @Body() updateSongDto: UpdateSongDto,
    @Request() req,
  ) {
    return this.songsService.update(id, updateSongDto, req.user.userId, req.user.role);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a pending song' })
  async approve(@Param('id') id: string, @Request() req) {
    return this.songsService.approve(id, req.user.userId);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a pending song' })
  async reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    return this.songsService.reject(id, req.user.userId, reason);
  }

  @Patch(':id/hide')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hide a song' })
  async hide(@Param('id') id: string) {
    return this.songsService.hide(id);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a song' })
  async publish(@Param('id') id: string) {
    return this.songsService.publish(id);
  }

  @Patch(':id/play')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Increment play count (admin plays are excluded)' })
  async incrementPlays(@Param('id') id: string, @Request() req) {
    // Exclude admin plays from statistics
    if (req.user.role === UserRole.ADMIN) {
      return { success: true, excluded: true, reason: 'admin_play' };
    }
    await this.songsService.incrementPlays(id);
    return { success: true };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a song' })
  async remove(@Param('id') id: string) {
    return this.songsService.remove(id);
  }
}

