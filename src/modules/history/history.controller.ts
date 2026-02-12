import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { HistoryService } from './history.service';
import type { UpdateHistoryDto, SyncHistoryDto, LogPlayDto } from './history.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('Listening History')
@Controller('history')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Post('update')
  @SkipThrottle() // Allow frequent updates for playback tracking
  @ApiOperation({ summary: 'Update listening history for a song' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        songId: { type: 'string' },
        currentPosition: { type: 'number', description: 'Current playback position in seconds' },
        duration: { type: 'number', description: 'Song duration in seconds' },
        listenedDuration: { type: 'number', description: 'Duration listened this session' },
        incrementPlay: { type: 'boolean', description: 'Whether to increment play count' },
      },
      required: ['songId', 'currentPosition'],
    },
  })
  async updateHistory(@Request() req, @Body() dto: UpdateHistoryDto) {
    return this.historyService.updateHistory(req.user.userId, dto);
  }

  @Post('sync')
  @SkipThrottle()
  @ApiOperation({ summary: 'Bulk sync history (on tab close or periodically)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        history: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              songId: { type: 'string' },
              currentPosition: { type: 'number' },
              duration: { type: 'number' },
              listenedDuration: { type: 'number' },
              playCount: { type: 'number' },
            },
          },
        },
      },
    },
  })
  async syncHistory(@Request() req, @Body() dto: SyncHistoryDto) {
    return this.historyService.syncHistory(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user listening history' })
  async getUserHistory(
    @Request() req,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.historyService.getUserHistory(req.user.userId, { limit, offset });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user listening statistics' })
  async getUserStats(@Request() req) {
    return this.historyService.getUserStats(req.user.userId);
  }

  @Get('song/:songId')
  @ApiOperation({ summary: 'Get history for a specific song' })
  async getSongHistory(@Request() req, @Param('songId') songId: string) {
    return this.historyService.getSongHistory(req.user.userId, songId);
  }

  @Post('songs')
  @ApiOperation({ summary: 'Get history for multiple songs' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        songIds: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async getSongsHistory(@Request() req, @Body('songIds') songIds: string[]) {
    return this.historyService.getSongsHistory(req.user.userId, songIds);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear all listening history' })
  async clearHistory(@Request() req) {
    return this.historyService.clearHistory(req.user.userId);
  }

  @Delete('song/:songId')
  @ApiOperation({ summary: 'Remove specific song from history' })
  async removeFromHistory(@Request() req, @Param('songId') songId: string) {
    return this.historyService.removeFromHistory(req.user.userId, songId);
  }

  // ============ ADMIN ENDPOINTS ============

  @Get('admin/analytics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Get global listening analytics' })
  async getGlobalAnalytics() {
    return this.historyService.getGlobalAnalytics();
  }

  @Get('admin/song/:songId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Get analytics for specific song' })
  async getSongAnalytics(@Param('songId') songId: string) {
    return this.historyService.getSongAnalytics(songId);
  }

  @Get('admin/top-songs')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Get top played songs' })
  async getTopSongs(@Query('limit') limit?: number) {
    return this.historyService.getTopSongs(limit);
  }

  @Get('admin/top-listeners')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Get top listeners' })
  async getTopListeners(@Query('limit') limit?: number) {
    return this.historyService.getTopListeners(limit);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user listening history' })
  async getMyHistory(@Request() req) {
    return this.historyService.getUserHistory(req.user.userId, {});
  }

  @Post('log-play')
  @SkipThrottle()
  @ApiOperation({ summary: 'Log song play (does not increment song plays - use /songs/:id/play for that)' })
  async logPlay(
    @Request() req,
    @Body('songId') songId: string,
    @Body('duration') duration: number,
    @Body('position') position: number,
  ) {
    // Note: incrementPlay is false here because the frontend already calls /songs/:id/play separately
    // This endpoint is just for logging to user's listening history
    return this.historyService.logPlayOnly(req.user.userId, {
      songId,
      duration,
      currentPosition: position,
    });
  }
}

