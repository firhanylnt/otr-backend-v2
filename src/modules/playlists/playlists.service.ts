import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Playlist, PlaylistStatus } from '../../entities/playlist.entity';
import { Song } from '../../entities/song.entity';
import { Genre } from '../../entities/genre.entity';
import { Mood } from '../../entities/mood.entity';

@Injectable()
export class PlaylistsService {
  constructor(
    @InjectRepository(Playlist)
    private playlistsRepository: Repository<Playlist>,
    @InjectRepository(Song)
    private songsRepository: Repository<Song>,
    @InjectRepository(Genre)
    private genresRepository: Repository<Genre>,
    @InjectRepository(Mood)
    private moodsRepository: Repository<Mood>,
  ) {}

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
  }

  async create(data: any, userId: string) {
    const playlist = this.playlistsRepository.create({
      title: data.title,
      slug: this.generateSlug(data.title),
      description: data.description,
      coverUrl: data.coverUrl,
      creatorId: userId,
      status: PlaylistStatus.DRAFT,
    });

    if (data.genreIds?.length) {
      playlist.genres = await this.genresRepository.findBy({ id: In(data.genreIds) });
    }

    if (data.moodIds?.length) {
      playlist.moods = await this.moodsRepository.findBy({ id: In(data.moodIds) });
    }

    if (data.songIds?.length) {
      playlist.songs = await this.songsRepository.findBy({ id: In(data.songIds) });
    }

    return this.playlistsRepository.save(playlist);
  }

  async findAll(options?: { status?: string; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = options || {};
    const query = this.playlistsRepository
      .createQueryBuilder('playlist')
      .leftJoinAndSelect('playlist.songs', 'song')
      .leftJoinAndSelect('playlist.genres', 'genre')
      .leftJoinAndSelect('playlist.moods', 'mood')
      .leftJoinAndSelect('playlist.creator', 'creator');

    if (status && status !== 'all') {
      query.andWhere('playlist.status = :status', { status });
    }

    const total = await query.getCount();
    const playlists = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('playlist.createdAt', 'DESC')
      .getMany();

    return { data: playlists, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const playlist = await this.playlistsRepository.findOne({
      where: { id },
      relations: ['songs', 'genres', 'moods', 'creator'],
    });
    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }
    return playlist;
  }

  async update(id: string, data: any) {
    const playlist = await this.findOne(id);
    Object.assign(playlist, data);

    if (data.genreIds) {
      playlist.genres = await this.genresRepository.findBy({ id: In(data.genreIds) });
    }

    if (data.moodIds) {
      playlist.moods = await this.moodsRepository.findBy({ id: In(data.moodIds) });
    }

    if (data.songIds) {
      playlist.songs = await this.songsRepository.findBy({ id: In(data.songIds) });
    }

    return this.playlistsRepository.save(playlist);
  }

  async remove(id: string) {
    const playlist = await this.findOne(id);
    await this.playlistsRepository.remove(playlist);
    return { success: true };
  }
}

