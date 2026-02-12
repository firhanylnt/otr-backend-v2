import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PicksService } from './picks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { PickType } from '../../entities/pick.entity';

@ApiTags('OTR Picks')
@Controller('picks')
export class PicksController {
  constructor(private readonly picksService: PicksService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add content as OTR pick' })
  async create(
    @Body() data: { contentType: PickType; contentId: string; curatorNote?: string },
  ) {
    return this.picksService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all OTR picks' })
  async findAll(
    @Query('type') type?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.picksService.findAll({ type, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get pick by ID' })
  async findOne(@Param('id') id: string) {
    return this.picksService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update OTR pick' })
  async update(
    @Param('id') id: string,
    @Body() data: { curatorNote?: string; sortOrder?: number; isActive?: boolean },
  ) {
    return this.picksService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove OTR pick' })
  async remove(@Param('id') id: string) {
    return this.picksService.remove(id);
  }
}

