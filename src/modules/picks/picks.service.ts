import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pick, PickType } from '../../entities/pick.entity';
import { Song } from '../../entities/song.entity';
import { Album } from '../../entities/album.entity';
import { Playlist } from '../../entities/playlist.entity';

@Injectable()
export class PicksService {
  constructor(
    @InjectRepository(Pick)
    private picksRepository: Repository<Pick>,
    @InjectRepository(Song)
    private songsRepository: Repository<Song>,
    @InjectRepository(Album)
    private albumsRepository: Repository<Album>,
    @InjectRepository(Playlist)
    private playlistsRepository: Repository<Playlist>,
  ) {}

  async create(data: { contentType: PickType; contentId: string; curatorNote?: string }) {
    const pick = this.picksRepository.create(data);
    
    // Mark content as OTR pick
    switch (data.contentType) {
      case PickType.SONG:
        await this.songsRepository.update(data.contentId, { isOtrPick: true });
        break;
      case PickType.ALBUM:
      case PickType.MIXTAPE:
        await this.albumsRepository.update(data.contentId, { isOtrPick: true });
        break;
      case PickType.PLAYLIST:
        await this.playlistsRepository.update(data.contentId, { isOtrPick: true });
        break;
    }
    
    return this.picksRepository.save(pick);
  }

  async findAll(options?: { type?: string; page?: number; limit?: number }) {
    const { type, page = 1, limit = 20 } = options || {};
    const query = this.picksRepository.createQueryBuilder('pick')
      .where('pick.isActive = :active', { active: true });

    if (type && type !== 'all') {
      query.andWhere('pick.contentType = :type', { type });
    }

    const total = await query.getCount();
    const picks = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('pick.sortOrder', 'ASC')
      .addOrderBy('pick.createdAt', 'DESC')
      .getMany();

    // Fetch actual content for each pick
    const enrichedPicks = await Promise.all(
      picks.map(async (pick) => {
        let content;
        switch (pick.contentType) {
          case PickType.SONG:
            content = await this.songsRepository.findOne({
              where: { id: pick.contentId },
              relations: ['creator', 'genres'],
            });
            break;
          case PickType.ALBUM:
          case PickType.MIXTAPE:
            content = await this.albumsRepository.findOne({
              where: { id: pick.contentId },
              relations: ['creator', 'genres'],
            });
            break;
          case PickType.PLAYLIST:
            content = await this.playlistsRepository.findOne({
              where: { id: pick.contentId },
              relations: ['creator', 'genres'],
            });
            break;
        }
        return { ...pick, content };
      }),
    );

    return {
      data: enrichedPicks,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const pick = await this.picksRepository.findOne({ where: { id } });
    if (!pick) {
      throw new NotFoundException('Pick not found');
    }

    let content;
    switch (pick.contentType) {
      case PickType.SONG:
        content = await this.songsRepository.findOne({
          where: { id: pick.contentId },
          relations: ['creator', 'genres'],
        });
        break;
      case PickType.ALBUM:
      case PickType.MIXTAPE:
        content = await this.albumsRepository.findOne({
          where: { id: pick.contentId },
          relations: ['creator', 'genres'],
        });
        break;
      case PickType.PLAYLIST:
        content = await this.playlistsRepository.findOne({
          where: { id: pick.contentId },
          relations: ['creator', 'genres'],
        });
        break;
    }

    return { ...pick, content };
  }

  async update(id: string, data: { curatorNote?: string; sortOrder?: number; isActive?: boolean }) {
    const pick = await this.picksRepository.findOne({ where: { id } });
    if (!pick) {
      throw new NotFoundException('Pick not found');
    }

    Object.assign(pick, data);
    return this.picksRepository.save(pick);
  }

  async remove(id: string) {
    const pick = await this.picksRepository.findOne({ where: { id } });
    if (!pick) {
      throw new NotFoundException('Pick not found');
    }

    // Unmark content as OTR pick
    switch (pick.contentType) {
      case PickType.SONG:
        await this.songsRepository.update(pick.contentId, { isOtrPick: false });
        break;
      case PickType.ALBUM:
      case PickType.MIXTAPE:
        await this.albumsRepository.update(pick.contentId, { isOtrPick: false });
        break;
      case PickType.PLAYLIST:
        await this.playlistsRepository.update(pick.contentId, { isOtrPick: false });
        break;
    }

    await this.picksRepository.remove(pick);
    return { success: true };
  }
}

