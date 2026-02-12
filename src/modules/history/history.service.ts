import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ListeningHistory } from '../../entities/listening-history.entity';
import { Song } from '../../entities/song.entity';
import { User, UserRole } from '../../entities/user.entity';

export interface UpdateHistoryDto {
  songId: string;
  currentPosition: number; // Current playback position in seconds
  duration?: number; // Song duration
  listenedDuration?: number; // How long they listened this session
  incrementPlay?: boolean; // Whether to increment play count
}

export interface LogPlayDto {
  songId: string;
  currentPosition: number;
  duration?: number;
}

export interface SyncHistoryDto {
  history: {
    songId: string;
    currentPosition: number;
    duration?: number;
    listenedDuration: number;
    playCount: number;
  }[];
}

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(ListeningHistory)
    private historyRepository: Repository<ListeningHistory>,
    @InjectRepository(Song)
    private songsRepository: Repository<Song>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * Check if user is admin
   */
  private async isUserAdmin(userId: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    return user?.role === UserRole.ADMIN;
  }

  /**
   * Log a play to user history without incrementing song play count
   * (Used when song play count is incremented separately via /songs/:id/play)
   */
  async logPlayOnly(userId: string, dto: LogPlayDto) {
    let songId = dto.songId;
    
    // If songId looks like a slug (contains letters after dash), resolve it to actual ID
    if (songId && !this.isValidUUID(songId)) {
      const song = await this.songsRepository.findOne({ where: { slug: songId } });
      if (song) {
        songId = song.id;
      } else {
        // If song not found by slug, just return without error
        console.warn(`Song not found by slug: ${dto.songId}`);
        return null;
      }
    }
    
    let history = await this.historyRepository.findOne({
      where: { userId, songId },
    });

    if (!history) {
      history = this.historyRepository.create({
        userId,
        songId,
        playCount: 0,
        totalListenedDuration: 0,
        lastPosition: 0,
      });
    }

    // Update position
    history.lastPosition = dto.currentPosition;
    history.lastListenedAt = new Date();

    // Update duration if provided
    if (dto.duration) {
      history.songDuration = dto.duration;
    }

    // Increment user's personal play count (but NOT the song's global play count)
    history.playCount += 1;

    await this.historyRepository.save(history);

    return history;
  }
  
  private isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  /**
   * Update or create listening history for a user-song pair
   */
  async updateHistory(userId: string, dto: UpdateHistoryDto) {
    let history = await this.historyRepository.findOne({
      where: { userId, songId: dto.songId },
    });

    if (!history) {
      history = this.historyRepository.create({
        userId,
        songId: dto.songId,
        playCount: 0,
        totalListenedDuration: 0,
        lastPosition: 0,
      });
    }

    // Update position
    history.lastPosition = dto.currentPosition;
    history.lastListenedAt = new Date();

    // Update duration if provided
    if (dto.duration) {
      history.songDuration = dto.duration;
    }

    // Add listened duration
    if (dto.listenedDuration && dto.listenedDuration > 0) {
      history.totalListenedDuration += dto.listenedDuration;
    }

    // Increment play count if requested
    if (dto.incrementPlay) {
      history.playCount += 1;
      
      // Only increment global play count if user is not admin
      const isAdmin = await this.isUserAdmin(userId);
      if (!isAdmin) {
        await this.songsRepository.increment({ id: dto.songId }, 'plays', 1);
      }
    }

    // Check if completed (listened more than 90% of song)
    if (history.songDuration && history.lastPosition > 0) {
      const percentListened = (history.lastPosition / history.songDuration) * 100;
      if (percentListened >= 90) {
        history.completed = true;
      }
    }

    await this.historyRepository.save(history);

    return history;
  }

  /**
   * Bulk sync history from frontend (when tab closes or periodically)
   */
  async syncHistory(userId: string, dto: SyncHistoryDto) {
    const results: ListeningHistory[] = [];

    for (const item of dto.history) {
      let songId = item.songId;
      
      // Resolve slug to UUID if needed
      if (songId && !this.isValidUUID(songId)) {
        const song = await this.songsRepository.findOne({ where: { slug: songId } });
        if (song) {
          songId = song.id;
        } else {
          // Skip demo/invalid content
          console.log(`Skipping history sync for non-existent song: ${item.songId}`);
          continue;
        }
      }
      
      let history = await this.historyRepository.findOne({
        where: { userId, songId },
      });

      if (!history) {
        history = this.historyRepository.create({
          userId,
          songId,
          playCount: 0,
          totalListenedDuration: 0,
          lastPosition: 0,
        });
      }

      // Update with synced data
      history.lastPosition = item.currentPosition;
      history.lastListenedAt = new Date();

      if (item.duration) {
        history.songDuration = item.duration;
      }

      if (item.listenedDuration > 0) {
        history.totalListenedDuration += item.listenedDuration;
      }

      if (item.playCount > 0) {
        history.playCount += item.playCount;
        // Only increment global play count if user is not admin
        const isAdmin = await this.isUserAdmin(userId);
        if (!isAdmin) {
          await this.songsRepository.increment({ id: songId }, 'plays', item.playCount);
        }
      }

      // Check completion
      if (history.songDuration && history.lastPosition > 0) {
        const percentListened = (history.lastPosition / history.songDuration) * 100;
        if (percentListened >= 90) {
          history.completed = true;
        }
      }

      await this.historyRepository.save(history);
      results.push(history);
    }

    return { synced: results.length, history: results };
  }

  /**
   * Get user's listening history
   */
  async getUserHistory(userId: string, options?: { limit?: number; offset?: number }) {
    const { limit = 50, offset = 0 } = options || {};

    const [history, total] = await this.historyRepository.findAndCount({
      where: { userId },
      relations: ['song', 'song.creator', 'song.genres'],
      order: { lastListenedAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      data: history.map(this.formatHistory),
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + history.length < total,
      },
    };
  }

  /**
   * Get history for a specific song (for resume playback)
   */
  async getSongHistory(userId: string, songId: string) {
    const history = await this.historyRepository.findOne({
      where: { userId, songId },
      relations: ['song'],
    });

    if (!history) {
      return {
        songId,
        playCount: 0,
        totalListenedDuration: 0,
        lastPosition: 0,
        completed: false,
      };
    }

    return this.formatHistory(history);
  }

  /**
   * Get multiple songs history at once (for batch loading)
   */
  async getSongsHistory(userId: string, songIds: string[]) {
    const histories = await this.historyRepository.find({
      where: songIds.map((songId) => ({ userId, songId })),
    });

    // Create a map for quick lookup
    const historyMap: Record<string, any> = {};
    for (const h of histories) {
      historyMap[h.songId] = this.formatHistory(h);
    }

    // Return history for all requested songs (with defaults for missing)
    return songIds.map((songId) => historyMap[songId] || {
      songId,
      playCount: 0,
      totalListenedDuration: 0,
      lastPosition: 0,
      completed: false,
    });
  }

  /**
   * Get user's listening stats
   */
  async getUserStats(userId: string) {
    const stats = await this.historyRepository
      .createQueryBuilder('h')
      .select('COUNT(DISTINCT h.songId)', 'uniqueSongs')
      .addSelect('SUM(h.playCount)', 'totalPlays')
      .addSelect('SUM(h.totalListenedDuration)', 'totalDuration')
      .addSelect('COUNT(CASE WHEN h.completed = true THEN 1 END)', 'completedSongs')
      .where('h.userId = :userId', { userId })
      .getRawOne();

    // Get most played songs
    const topSongs = await this.historyRepository.find({
      where: { userId },
      relations: ['song', 'song.creator'],
      order: { playCount: 'DESC' },
      take: 10,
    });

    // Get recently played
    const recentlyPlayed = await this.historyRepository.find({
      where: { userId },
      relations: ['song', 'song.creator'],
      order: { lastListenedAt: 'DESC' },
      take: 10,
    });

    return {
      uniqueSongs: parseInt(stats.uniqueSongs) || 0,
      totalPlays: parseInt(stats.totalPlays) || 0,
      totalDuration: parseFloat(stats.totalDuration) || 0,
      totalDurationFormatted: this.formatDuration(parseFloat(stats.totalDuration) || 0),
      completedSongs: parseInt(stats.completedSongs) || 0,
      topSongs: topSongs.map(this.formatHistory),
      recentlyPlayed: recentlyPlayed.map(this.formatHistory),
    };
  }

  /**
   * ADMIN: Get global listening analytics (excludes admin users from all calculations)
   */
  async getGlobalAnalytics() {
    const adminRole = 'admin';
    
    // Total plays across all users (excluding admins)
    const totalStats = await this.historyRepository
      .createQueryBuilder('h')
      .innerJoin('h.user', 'u')
      .select('COUNT(DISTINCT h.userId)', 'uniqueListeners')
      .addSelect('COUNT(DISTINCT h.songId)', 'uniqueSongsPlayed')
      .addSelect('SUM(h.playCount)', 'totalPlays')
      .addSelect('SUM(h.totalListenedDuration)', 'totalDuration')
      .where('u.role != :adminRole', { adminRole })
      .getRawOne();

    // Today's stats (excluding admins)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStats = await this.historyRepository
      .createQueryBuilder('h')
      .innerJoin('h.user', 'u')
      .select('COUNT(DISTINCT h.userId)', 'activeListeners')
      .addSelect('SUM(h.playCount)', 'playsToday')
      .where('h.lastListenedAt >= :today', { today })
      .andWhere('u.role != :adminRole', { adminRole })
      .getRawOne();

    // This week stats (excluding admins)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekStats = await this.historyRepository
      .createQueryBuilder('h')
      .innerJoin('h.user', 'u')
      .select('COUNT(DISTINCT h.userId)', 'weeklyListeners')
      .addSelect('SUM(h.playCount)', 'weeklyPlays')
      .where('h.lastListenedAt >= :weekAgo', { weekAgo })
      .andWhere('u.role != :adminRole', { adminRole })
      .getRawOne();

    // Top songs globally (excluding admin plays)
    const topSongs = await this.historyRepository
      .createQueryBuilder('h')
      .innerJoin('h.user', 'u')
      .select('h.songId', 'songId')
      .addSelect('SUM(h.playCount)', 'totalPlays')
      .addSelect('COUNT(DISTINCT h.userId)', 'uniqueListeners')
      .where('u.role != :adminRole', { adminRole })
      .groupBy('h.songId')
      .orderBy('"totalPlays"', 'DESC')
      .limit(10)
      .getRawMany();

    // Get song details for top songs
    const topSongIds = topSongs.map(s => s.songId);
    const songs = topSongIds.length > 0 
      ? await this.songsRepository.find({
          where: topSongIds.map(id => ({ id })),
          relations: ['creator'],
        })
      : [];

    const songMap: Record<string, any> = {};
    for (const song of songs) {
      songMap[song.id] = song;
    }

    // Top listeners (excluding admins)
    const topListeners = await this.historyRepository
      .createQueryBuilder('h')
      .innerJoin('h.user', 'u')
      .select('h.userId', 'userId')
      .addSelect('SUM(h.playCount)', 'totalPlays')
      .addSelect('SUM(h.totalListenedDuration)', 'totalDuration')
      .addSelect('COUNT(DISTINCT h.songId)', 'uniqueSongs')
      .where('u.role != :adminRole', { adminRole })
      .groupBy('h.userId')
      .orderBy('"totalPlays"', 'DESC')
      .limit(10)
      .getRawMany();

    // Get user details for top listeners
    const topListenerIds = topListeners.map(l => l.userId).filter(Boolean);
    let users: any[] = [];
    if (topListenerIds.length > 0) {
      try {
        users = await this.historyRepository.manager.query(
          `SELECT id, username, "displayName", "avatarUrl" FROM users WHERE id = ANY($1::uuid[])`,
          [topListenerIds]
        );
      } catch (e) {
        console.error('Failed to fetch user details:', e);
      }
    }
    
    const userMap: Record<string, any> = {};
    for (const user of users) {
      userMap[user.id] = user;
    }

    // Listening trends (last 7 days, excluding admins)
    const trends = await this.historyRepository
      .createQueryBuilder('h')
      .innerJoin('h.user', 'u')
      .select('DATE(h.lastListenedAt)', 'date')
      .addSelect('SUM(h.playCount)', 'plays')
      .addSelect('COUNT(DISTINCT h.userId)', 'listeners')
      .where('h.lastListenedAt >= :weekAgo', { weekAgo })
      .andWhere('u.role != :adminRole', { adminRole })
      .groupBy('DATE(h.lastListenedAt)')
      .orderBy('"date"', 'ASC')
      .getRawMany();

    return {
      overview: {
        uniqueListeners: parseInt(totalStats.uniqueListeners) || 0,
        uniqueSongsPlayed: parseInt(totalStats.uniqueSongsPlayed) || 0,
        totalPlays: parseInt(totalStats.totalPlays) || 0,
        totalDuration: parseFloat(totalStats.totalDuration) || 0,
        totalDurationFormatted: this.formatDuration(parseFloat(totalStats.totalDuration) || 0),
      },
      today: {
        activeListeners: parseInt(todayStats.activeListeners) || 0,
        plays: parseInt(todayStats.playsToday) || 0,
      },
      thisWeek: {
        listeners: parseInt(weekStats.weeklyListeners) || 0,
        plays: parseInt(weekStats.weeklyPlays) || 0,
      },
      topSongs: topSongs.map(s => ({
        songId: s.songId,
        totalPlays: parseInt(s.totalPlays) || 0,
        uniqueListeners: parseInt(s.uniqueListeners) || 0,
        song: songMap[s.songId] ? {
          id: songMap[s.songId].id,
          title: songMap[s.songId].title,
          coverUrl: songMap[s.songId].coverUrl,
          creator: songMap[s.songId].creator ? {
            id: songMap[s.songId].creator.id,
            username: songMap[s.songId].creator.username,
            displayName: songMap[s.songId].creator.displayName,
          } : null,
        } : null,
      })),
      topListeners: topListeners.map(l => ({
        userId: l.userId,
        totalPlays: parseInt(l.totalPlays) || 0,
        totalDuration: parseFloat(l.totalDuration) || 0,
        totalDurationFormatted: this.formatDuration(parseFloat(l.totalDuration) || 0),
        uniqueSongs: parseInt(l.uniqueSongs) || 0,
        user: userMap[l.userId] ? {
          id: userMap[l.userId].id,
          username: userMap[l.userId].username,
          displayName: userMap[l.userId].displayName,
          avatarUrl: userMap[l.userId].avatarUrl,
        } : null,
      })),
      trends,
    };
  }

  /**
   * ADMIN: Get song analytics
   */
  async getSongAnalytics(songId: string) {
    const stats = await this.historyRepository
      .createQueryBuilder('h')
      .select('COUNT(DISTINCT h.userId)', 'uniqueListeners')
      .addSelect('SUM(h.playCount)', 'totalPlays')
      .addSelect('SUM(h.totalListenedDuration)', 'totalDuration')
      .addSelect('AVG(h.lastPosition / NULLIF(h.songDuration, 0) * 100)', 'avgCompletion')
      .where('h.songId = :songId', { songId })
      .getRawOne();

    // Recent listeners
    const recentListeners = await this.historyRepository.find({
      where: { songId },
      relations: ['user'],
      order: { lastListenedAt: 'DESC' },
      take: 20,
    });

    return {
      songId,
      uniqueListeners: parseInt(stats.uniqueListeners) || 0,
      totalPlays: parseInt(stats.totalPlays) || 0,
      totalDuration: parseFloat(stats.totalDuration) || 0,
      totalDurationFormatted: this.formatDuration(parseFloat(stats.totalDuration) || 0),
      avgCompletionRate: parseFloat(stats.avgCompletion) || 0,
      recentListeners: recentListeners.map(h => ({
        userId: h.userId,
        playCount: h.playCount,
        lastListenedAt: h.lastListenedAt,
      })),
    };
  }

  /**
   * ADMIN: Get top played songs
   */
  async getTopSongs(limit = 10) {
    const topSongs = await this.historyRepository
      .createQueryBuilder('h')
      .select('h.songId', 'songId')
      .addSelect('SUM(h.playCount)', 'totalPlays')
      .addSelect('COUNT(DISTINCT h.userId)', 'uniqueListeners')
      .groupBy('h.songId')
      .orderBy('"totalPlays"', 'DESC')
      .limit(limit)
      .getRawMany();

    // Get song details
    const songIds = topSongs.map(s => s.songId);
    const songs = songIds.length > 0
      ? await this.songsRepository.find({
          where: songIds.map(id => ({ id })),
          relations: ['creator', 'genres'],
        })
      : [];

    const songMap: Record<string, any> = {};
    for (const song of songs) {
      songMap[song.id] = song;
    }

    return topSongs.map(s => ({
      songId: s.songId,
      totalPlays: parseInt(s.totalPlays) || 0,
      uniqueListeners: parseInt(s.uniqueListeners) || 0,
      song: songMap[s.songId] ? {
        id: songMap[s.songId].id,
        title: songMap[s.songId].title,
        slug: songMap[s.songId].slug,
        coverUrl: songMap[s.songId].coverUrl,
        duration: songMap[s.songId].duration,
        creator: songMap[s.songId].creator ? {
          id: songMap[s.songId].creator.id,
          username: songMap[s.songId].creator.username,
          displayName: songMap[s.songId].creator.displayName,
        } : null,
        genres: songMap[s.songId].genres?.map((g: any) => ({
          id: g.id,
          name: g.name,
          slug: g.slug,
        })),
      } : null,
    }));
  }

  /**
   * ADMIN: Get top listeners
   */
  async getTopListeners(limit = 10) {
    const topListeners = await this.historyRepository
      .createQueryBuilder('h')
      .select('h.userId', 'userId')
      .addSelect('SUM(h.playCount)', 'totalPlays')
      .addSelect('SUM(h.totalListenedDuration)', 'totalDuration')
      .addSelect('COUNT(DISTINCT h.songId)', 'uniqueSongs')
      .groupBy('h.userId')
      .orderBy('"totalPlays"', 'DESC')
      .limit(limit)
      .getRawMany();

    return topListeners.map(l => ({
      userId: l.userId,
      totalPlays: parseInt(l.totalPlays) || 0,
      totalDuration: parseFloat(l.totalDuration) || 0,
      totalDurationFormatted: this.formatDuration(parseFloat(l.totalDuration) || 0),
      uniqueSongs: parseInt(l.uniqueSongs) || 0,
    }));
  }

  /**
   * Clear user's history
   */
  async clearHistory(userId: string) {
    await this.historyRepository.delete({ userId });
    return { success: true };
  }

  /**
   * Remove specific song from history
   */
  async removeFromHistory(userId: string, songId: string) {
    await this.historyRepository.delete({ userId, songId });
    return { success: true };
  }

  private formatHistory(history: ListeningHistory) {
    return {
      id: history.id,
      songId: history.songId,
      song: history.song ? {
        id: history.song.id,
        title: history.song.title,
        slug: history.song.slug,
        coverUrl: history.song.coverUrl,
        audioUrl: history.song.audioUrl,
        duration: history.song.duration,
        creator: history.song.creator ? {
          id: history.song.creator.id,
          username: history.song.creator.username,
          displayName: history.song.creator.displayName,
        } : null,
      } : null,
      playCount: history.playCount,
      totalListenedDuration: history.totalListenedDuration,
      totalListenedFormatted: this.formatDuration(history.totalListenedDuration),
      lastPosition: history.lastPosition,
      songDuration: history.songDuration,
      completed: history.completed,
      lastListenedAt: history.lastListenedAt,
    };
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  }
}
