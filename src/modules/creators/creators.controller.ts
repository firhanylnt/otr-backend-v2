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
import { CreatorsService } from './creators.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, UserStatus } from '../../entities/user.entity';

@ApiTags('Creators')
@Controller('creators')
export class CreatorsController {
  constructor(private readonly creatorsService: CreatorsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all creators' })
  async findAll(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.creatorsService.findAll({ status, search, page, limit });
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get creator statistics (Admin only)' })
  async getStats() {
    return this.creatorsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get creator by ID' })
  async findOne(@Param('id') id: string) {
    return this.creatorsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new creator (Admin only)' })
  async create(@Body() createCreatorDto: any) {
    return this.creatorsService.create(createCreatorDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update creator (Admin only)' })
  async update(@Param('id') id: string, @Body() updateCreatorDto: any) {
    return this.creatorsService.update(id, updateCreatorDto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update creator status' })
  async updateStatus(@Param('id') id: string, @Body('status') status: UserStatus) {
    return this.creatorsService.updateStatus(id, status);
  }

  @Patch(':id/upgrade')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upgrade creator to resident' })
  async upgradeToResident(@Param('id') id: string) {
    return this.creatorsService.upgradeToResident(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete creator (Admin only)' })
  async remove(@Param('id') id: string) {
    return this.creatorsService.remove(id);
  }
}

