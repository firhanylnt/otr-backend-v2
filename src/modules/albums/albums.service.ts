import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Album, AlbumStatus } from '../../entities/album.entity';
import { Song } from '../../entities/song.entity';
import { Genre } from '../../entities/genre.entity';
import { Mood } from '../../entities/mood.entity';

@Injectable()
export class AlbumsService {
  constructor(
    @InjectRepository(Album)
    private albumsRepository: Repository<Album>,
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
    const album = this.albumsRepository.create({
      title: data.title,
      slug: this.generateSlug(data.title),
      description: data.description,
      coverUrl: data.coverUrl,
      bannerUrl: data.bannerUrl,
      type: data.type,
      creatorId: userId,
      status: AlbumStatus.DRAFT,
    });

    if (data.genreIds?.length) {
      album.genres = await this.genresRepository.findBy({ id: In(data.genreIds) });
    }

    if (data.moodIds?.length) {
      album.moods = await this.moodsRepository.findBy({ id: In(data.moodIds) });
    }

    if (data.songIds?.length) {
      album.songs = await this.songsRepository.findBy({ id: In(data.songIds) });
    }

    return this.albumsRepository.save(album);
  }

  async findAll(options?: { status?: string; type?: string; page?: number; limit?: number }) {
    const { status, type, page = 1, limit = 20 } = options || {};
    const query = this.albumsRepository
      .createQueryBuilder('album')
      .leftJoinAndSelect('album.songs', 'song')
      .leftJoinAndSelect('album.genres', 'genre')
      .leftJoinAndSelect('album.moods', 'mood')
      .leftJoinAndSelect('album.creator', 'creator');

    if (status && status !== 'all') {
      query.andWhere('album.status = :status', { status });
    }

    if (type && type !== 'all') {
      query.andWhere('album.type = :type', { type });
    }

    const total = await query.getCount();
    const albums = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('album.createdAt', 'DESC')
      .getMany();

    return { data: albums, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const album = await this.albumsRepository.findOne({
      where: { id },
      relations: ['songs', 'genres', 'moods', 'creator'],
    });
    if (!album) {
      throw new NotFoundException('Album not found');
    }
    return album;
  }

  async findBySlug(slug: string) {
    const album = await this.albumsRepository.findOne({
      where: { slug },
      relations: ['songs', 'genres', 'moods', 'creator'],
    });
    if (!album) {
      throw new NotFoundException('Album not found');
    }
    return album;
  }

  async update(id: string, data: any) {
    const album = await this.findOne(id);
    Object.assign(album, data);

    if (data.genreIds) {
      album.genres = await this.genresRepository.findBy({ id: In(data.genreIds) });
    }

    if (data.moodIds) {
      album.moods = await this.moodsRepository.findBy({ id: In(data.moodIds) });
    }

    if (data.songIds) {
      album.songs = await this.songsRepository.findBy({ id: In(data.songIds) });
    }

    return this.albumsRepository.save(album);
  }

  async remove(id: string) {
    const album = await this.findOne(id);
    await this.albumsRepository.remove(album);
    return { success: true };
  }
}

