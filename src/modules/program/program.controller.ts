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
import { ProgramService } from './program.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { ProgramShow, Episode } from '../../entities/program-show.entity';

@ApiTags('Program')
@Controller('program')
export class ProgramController {
  constructor(private readonly programService: ProgramService) {}

  // ============ PROGRAM ENDPOINTS ============

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new program' })
  async create(@Body() data: Partial<ProgramShow>) {
    return this.programService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all programs' })
  async findAll(@Query('includeInactive') includeInactive?: boolean) {
    return this.programService.findAll(includeInactive);
  }

  @Get('schedule')
  @ApiOperation({ summary: 'Get weekly schedule' })
  async getSchedule() {
    return this.programService.getSchedule();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get program by ID' })
  async findOne(@Param('id') id: string) {
    return this.programService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get program by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.programService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a program' })
  async update(@Param('id') id: string, @Body() data: Partial<ProgramShow>) {
    return this.programService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a program' })
  async remove(@Param('id') id: string) {
    return this.programService.remove(id);
  }

  // ============ EPISODE ENDPOINTS ============

  @Post(':programId/episodes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new episode for a program' })
  async createEpisode(
    @Param('programId') programId: string,
    @Body() data: Partial<Episode>,
  ) {
    return this.programService.createEpisode(programId, data);
  }

  @Post(':programId/episodes/bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create multiple episodes for a program' })
  async createBulkEpisodes(
    @Param('programId') programId: string,
    @Body() episodes: Partial<Episode>[],
  ) {
    return this.programService.createBulkEpisodes(programId, episodes);
  }

  @Get(':programId/episodes')
  @ApiOperation({ summary: 'Get all episodes for a program' })
  async findAllEpisodes(@Param('programId') programId: string) {
    return this.programService.findAllEpisodes(programId);
  }

  @Get('episodes/:id')
  @ApiOperation({ summary: 'Get episode by ID' })
  async findOneEpisode(@Param('id') id: string) {
    return this.programService.findOneEpisode(id);
  }

  @Patch('episodes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an episode' })
  async updateEpisode(
    @Param('id') id: string,
    @Body() data: Partial<Episode>,
  ) {
    return this.programService.updateEpisode(id, data);
  }

  @Delete('episodes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an episode' })
  async removeEpisode(@Param('id') id: string) {
    return this.programService.removeEpisode(id);
  }
}
