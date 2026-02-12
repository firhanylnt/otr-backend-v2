import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Song, SongStatus } from '../../entities/song.entity';
import { Genre } from '../../entities/genre.entity';
import { Mood } from '../../entities/mood.entity';
import { User, UserRole } from '../../entities/user.entity';
import { ListeningHistory } from '../../entities/listening-history.entity';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';

@Injectable()
export class SongsService {
  constructor(
    @InjectRepository(Song)
    private songsRepository: Repository<Song>,
    @InjectRepository(Genre)
    private genresRepository: Repository<Genre>,
    @InjectRepository(Mood)
    private moodsRepository: Repository<Mood>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(ListeningHistory)
    private historyRepository: Repository<ListeningHistory>,
  ) {}

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
  }

  async create(createSongDto: CreateSongDto, userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Determine status: use provided status, or auto-publish for admins, pending for others
    let status = SongStatus.PENDING;
    if (createSongDto.status) {
      status = createSongDto.status;
    } else if (user.role === UserRole.ADMIN) {
      status = SongStatus.PUBLISHED;
    }

    const song = this.songsRepository.create({
      title: createSongDto.title,
      slug: this.generateSlug(createSongDto.title),
      description: createSongDto.description,
      coverUrl: createSongDto.coverUrl,
      bannerUrl: createSongDto.bannerUrl,
      audioUrl: createSongDto.audioUrl,
      duration: createSongDto.duration,
      label: createSongDto.label,
      creatorId: userId,
      status,
      publishedAt: status === SongStatus.PUBLISHED ? new Date() : undefined,
    });

    // Handle genres
    if (createSongDto.genreIds?.length) {
      song.genres = await this.genresRepository.findBy({
        id: In(createSongDto.genreIds),
      });
    }

    // Handle moods
    if (createSongDto.moodIds?.length) {
      song.moods = await this.moodsRepository.findBy({
        id: In(createSongDto.moodIds),
      });
    }

    await this.songsRepository.save(song);
    return this.findOne(song.id);
  }

  async findAll(options?: {
    status?: string;
    genre?: string;
    search?: string;
    creatorId?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, genre, search, creatorId, page = 1, limit = 20 } = options || {};

    const query = this.songsRepository
      .createQueryBuilder('song')
      .leftJoinAndSelect('song.genres', 'genre')
      .leftJoinAndSelect('song.moods', 'mood')
      .leftJoinAndSelect('song.creator', 'creator');

    if (status && status !== 'all') {
      query.andWhere('song.status = :status', { status });
    }

    if (genre && genre !== 'all') {
      query.andWhere('genre.slug = :genre', { genre });
    }

    if (creatorId) {
      query.andWhere('song.creatorId = :creatorId', { creatorId });
    }

    if (search) {
      query.andWhere(
        '(song.title ILIKE :search OR song.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const total = await query.getCount();
    const songs = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('song.createdAt', 'DESC')
      .getMany();

    // Calculate plays for all songs (excluding admin plays)
    const songIds = songs.map(s => s.id);
    const playsMap = await this.getBatchPlaysExcludingAdmin(songIds);

    return {
      data: songs.map(song => this.formatSong(song, playsMap.get(song.id) || 0)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPublished(options?: {
    genre?: string;
    mood?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { genre, mood, search, page = 1, limit = 20 } = options || {};

    const query = this.songsRepository
      .createQueryBuilder('song')
      .leftJoinAndSelect('song.genres', 'genre')
      .leftJoinAndSelect('song.moods', 'mood')
      .leftJoinAndSelect('song.creator', 'creator')
      .where('song.status = :status', { status: SongStatus.PUBLISHED });

    if (genre) {
      query.andWhere('genre.slug = :genre', { genre });
    }

    if (mood) {
      query.andWhere('mood.slug = :mood', { mood });
    }

    if (search) {
      query.andWhere(
        '(song.title ILIKE :search OR song.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const total = await query.getCount();
    const songs = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('song.publishedAt', 'DESC')
      .getMany();

    // Calculate plays for all songs (excluding admin plays)
    const songIds = songs.map(s => s.id);
    const playsMap = await this.getBatchPlaysExcludingAdmin(songIds);

    return {
      data: songs.map(song => this.formatSong(song, playsMap.get(song.id) || 0)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPending() {
    const songs = await this.songsRepository.find({
      where: { status: SongStatus.PENDING },
      relations: ['genres', 'moods', 'creator'],
      order: { createdAt: 'ASC' },
    });
    
    // Calculate plays for all songs (excluding admin plays)
    const songIds = songs.map(s => s.id);
    const playsMap = await this.getBatchPlaysExcludingAdmin(songIds);
    
    return songs.map(song => this.formatSong(song, playsMap.get(song.id) || 0));
  }

  async findOne(id: string) {
    const song = await this.songsRepository.findOne({
      where: { id },
      relations: ['genres', 'moods', 'creator'],
    });
    if (!song) {
      throw new NotFoundException('Song not found');
    }
    // Calculate plays excluding admin users
    const plays = await this.getPlaysExcludingAdmin(song.id);
    return this.formatSong(song, plays);
  }

  async findBySlug(slug: string) {
    const song = await this.songsRepository.findOne({
      where: { slug },
      relations: ['genres', 'moods', 'creator'],
    });
    if (!song) {
      throw new NotFoundException('Song not found');
    }
    // Calculate plays excluding admin users
    const plays = await this.getPlaysExcludingAdmin(song.id);
    return this.formatSong(song, plays);
  }

  /**
   * Calculate plays for a song excluding admin listeners
   */
  private async getPlaysExcludingAdmin(songId: string): Promise<number> {
    const result = await this.historyRepository
      .createQueryBuilder('h')
      .innerJoin('users', 'u', 'u.id = h.userId')
      .select('COALESCE(SUM(h.playCount), 0)', 'totalPlays')
      .where('h.songId = :songId', { songId })
      .andWhere('u.role != :adminRole', { adminRole: UserRole.ADMIN })
      .getRawOne();
    return parseInt(result?.totalPlays) || 0;
  }

  /**
   * Calculate plays for multiple songs excluding admin listeners (batch query)
   */
  private async getBatchPlaysExcludingAdmin(songIds: string[]): Promise<Map<string, number>> {
    const playsMap = new Map<string, number>();
    
    if (songIds.length === 0) {
      return playsMap;
    }

    const results = await this.historyRepository
      .createQueryBuilder('h')
      .innerJoin('users', 'u', 'u.id = h.userId')
      .select('h.songId', 'songId')
      .addSelect('COALESCE(SUM(h.playCount), 0)', 'totalPlays')
      .where('h.songId IN (:...songIds)', { songIds })
      .andWhere('u.role != :adminRole', { adminRole: UserRole.ADMIN })
      .groupBy('h.songId')
      .getRawMany();

    for (const result of results) {
      playsMap.set(result.songId, parseInt(result.totalPlays) || 0);
    }

    return playsMap;
  }

  async update(id: string, updateSongDto: UpdateSongDto, userId: string, userRole: UserRole) {
    const song = await this.songsRepository.findOne({
      where: { id },
      relations: ['genres', 'moods'],
    });
    if (!song) {
      throw new NotFoundException('Song not found');
    }

    // Only admin or song owner can update
    if (userRole !== UserRole.ADMIN && song.creatorId !== userId) {
      throw new ForbiddenException('Not authorized to update this song');
    }

    Object.assign(song, updateSongDto);

    if (updateSongDto.genreIds) {
      song.genres = await this.genresRepository.findBy({
        id: In(updateSongDto.genreIds),
      });
    }

    if (updateSongDto.moodIds) {
      song.moods = await this.moodsRepository.findBy({
        id: In(updateSongDto.moodIds),
      });
    }

    await this.songsRepository.save(song);
    return this.findOne(id);
  }

  async approve(id: string, adminId: string) {
    const song = await this.songsRepository.findOne({ where: { id } });
    if (!song) {
      throw new NotFoundException('Song not found');
    }
    song.status = SongStatus.PUBLISHED;
    song.reviewedBy = adminId;
    song.reviewedAt = new Date();
    song.publishedAt = new Date();
    await this.songsRepository.save(song);
    return this.findOne(id);
  }

  async reject(id: string, adminId: string, reason?: string) {
    const song = await this.songsRepository.findOne({ where: { id } });
    if (!song) {
      throw new NotFoundException('Song not found');
    }
    song.status = SongStatus.REJECTED;
    song.reviewedBy = adminId;
    song.reviewedAt = new Date();
    song.rejectionReason = reason || '';
    await this.songsRepository.save(song);
    return this.findOne(id);
  }

  async hide(id: string) {
    const song = await this.songsRepository.findOne({ where: { id } });
    if (!song) {
      throw new NotFoundException('Song not found');
    }
    song.status = SongStatus.HIDDEN;
    await this.songsRepository.save(song);
    return this.findOne(id);
  }

  async publish(id: string) {
    const song = await this.songsRepository.findOne({ where: { id } });
    if (!song) {
      throw new NotFoundException('Song not found');
    }
    song.status = SongStatus.PUBLISHED;
    song.publishedAt = new Date();
    await this.songsRepository.save(song);
    return this.findOne(id);
  }

  async incrementPlays(idOrSlug: string) {
    // Try incrementing by ID first
    const result = await this.songsRepository.increment({ id: idOrSlug }, 'plays', 1);
    
    // If no rows affected, try by slug
    if (result.affected === 0) {
      await this.songsRepository.increment({ slug: idOrSlug }, 'plays', 1);
    }
  }

  async remove(id: string) {
    const song = await this.songsRepository.findOne({ where: { id } });
    if (!song) {
      throw new NotFoundException('Song not found');
    }
    await this.songsRepository.remove(song);
    return { success: true };
  }

  async getStats() {
    const total = await this.songsRepository.count();
    const published = await this.songsRepository.count({
      where: { status: SongStatus.PUBLISHED },
    });
    const pending = await this.songsRepository.count({
      where: { status: SongStatus.PENDING },
    });
    
    // Calculate totalPlays from listening_history excluding admin users
    const totalPlays = await this.historyRepository
      .createQueryBuilder('h')
      .innerJoin('users', 'u', 'u.id = h.userId')
      .select('COALESCE(SUM(h.playCount), 0)', 'total')
      .where('u.role != :adminRole', { adminRole: UserRole.ADMIN })
      .getRawOne();

    return {
      total,
      published,
      pending,
      totalPlays: parseInt(totalPlays?.total) || 0,
    };
  }

  private formatSong(song: Song, calculatedPlays?: number) {
    return {
      id: song.id,
      title: song.title,
      slug: song.slug,
      description: song.description,
      coverUrl: song.coverUrl,
      bannerUrl: song.bannerUrl,
      audioUrl: song.audioUrl,
      duration: song.duration,
      plays: calculatedPlays !== undefined ? calculatedPlays : song.plays,
      likes: song.likes,
      status: song.status,
      genres: song.genres?.map((g) => ({
        id: g.id,
        name: g.name,
        slug: g.slug,
        color: g.color,
      })),
      moods: song.moods?.map((m) => ({
        id: m.id,
        name: m.name,
        slug: m.slug,
        color: m.color,
      })),
      creator: song.creator
        ? {
            id: song.creator.id,
            username: song.creator.username,
            displayName: song.creator.displayName,
            avatar: song.creator.avatarUrl,
          }
        : null,
      isOtrPick: song.isOtrPick,
      isFeatured: song.isFeatured,
      publishedAt: song.publishedAt,
      createdAt: song.createdAt,
    };
  }
}

