import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HighlightsService } from './highlights.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { HighlightPosition } from '../../entities/highlight.entity';

@ApiTags('Highlights')
@Controller('highlights')
export class HighlightsController {
  constructor(private readonly highlightsService: HighlightsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create highlight' })
  async create(
    @Body() data: {
      position: HighlightPosition;
      sideIndex?: number;
      contentId: string;
      title: string;
      artist?: string;
      image?: string;
      customImage?: string;
      tag?: string;
      type?: string;
      link?: string;
      active?: boolean;
    },
  ) {
    return this.highlightsService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all highlights' })
  async findAll(@Query('active') active?: string) {
    const isActive = active === 'true' ? true : active === 'false' ? false : undefined;
    return this.highlightsService.findAll({ active: isActive });
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active highlights for homepage' })
  async findActive() {
    return this.highlightsService.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get highlight by ID' })
  async findOne(@Param('id') id: string) {
    return this.highlightsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update highlight' })
  async update(
    @Param('id') id: string,
    @Body() data: Partial<{
      position: HighlightPosition;
      sideIndex: number;
      contentId: string;
      title: string;
      artist: string;
      image: string;
      customImage: string;
      tag: string;
      type: string;
      link: string;
      active: boolean;
    }>,
  ) {
    return this.highlightsService.update(id, data);
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle highlight active status' })
  async toggleActive(@Param('id') id: string) {
    return this.highlightsService.toggleActive(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete highlight' })
  async remove(@Param('id') id: string) {
    return this.highlightsService.remove(id);
  }
}
