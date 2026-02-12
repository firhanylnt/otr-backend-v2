import {
  Controller,
  Get,
  Post,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ResidentsService } from './residents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, UserStatus } from '../../entities/user.entity';

@ApiTags('Residents')
@Controller('residents')
export class ResidentsController {
  constructor(private readonly residentsService: ResidentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all residents' })
  async findAll(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.residentsService.findAll({ status, search, page, limit });
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get resident statistics (Admin only)' })
  async getStats() {
    return this.residentsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get resident by ID' })
  async findOne(@Param('id') id: string) {
    return this.residentsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add creators as residents' })
  async addResidents(@Body('creatorIds') creatorIds: string[]) {
    return this.residentsService.addResidents(creatorIds);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update resident (Admin only)' })
  async update(@Param('id') id: string, @Body() updateResidentDto: any) {
    return this.residentsService.update(id, updateResidentDto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update resident status' })
  async updateStatus(@Param('id') id: string, @Body('status') status: UserStatus) {
    return this.residentsService.updateStatus(id, status);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove resident (downgrade to creator)' })
  async removeResident(@Param('id') id: string) {
    return this.residentsService.removeResident(id);
  }
}

