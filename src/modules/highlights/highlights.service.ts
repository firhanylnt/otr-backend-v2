import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Highlight, HighlightPosition } from '../../entities/highlight.entity';
import { Song } from '../../entities/song.entity';

@Injectable()
export class HighlightsService {
  constructor(
    @InjectRepository(Highlight)
    private highlightsRepository: Repository<Highlight>,
    @InjectRepository(Song)
    private songsRepository: Repository<Song>,
  ) {}

  async create(data: {
    position: HighlightPosition;
    sideIndex?: number;
    contentId?: string;
    title: string;
    artist?: string;
    image?: string;
    customImage?: string;
    tag?: string;
    type?: string;
    link?: string;
    active?: boolean;
  }) {
    // If adding to same position, deactivate existing
    if (data.position === HighlightPosition.MAIN) {
      await this.highlightsRepository.update(
        { position: HighlightPosition.MAIN },
        { active: false },
      );
    } else if (data.position === HighlightPosition.SIDE && data.sideIndex !== undefined) {
      await this.highlightsRepository.update(
        { position: HighlightPosition.SIDE, sideIndex: data.sideIndex },
        { active: false },
      );
    }

    const highlight = this.highlightsRepository.create({
      ...data,
      active: data.active !== false,
    });
    
    return this.highlightsRepository.save(highlight);
  }

  async findAll(options?: { active?: boolean }) {
    const { active } = options || {};
    
    const query = this.highlightsRepository.createQueryBuilder('highlight')
      .leftJoinAndSelect('highlight.content', 'content')
      .leftJoinAndSelect('content.creator', 'creator');

    if (active !== undefined) {
      query.where('highlight.active = :active', { active });
    }

    const highlights = await query
      .orderBy('highlight.position', 'ASC')
      .addOrderBy('highlight.sideIndex', 'ASC')
      .addOrderBy('highlight.sortOrder', 'ASC')
      .getMany();

    return highlights;
  }

  async findActive() {
    const highlights = await this.findAll({ active: true });
    
    const main = highlights.find(h => h.position === HighlightPosition.MAIN);
    const side1 = highlights.find(h => h.position === HighlightPosition.SIDE && h.sideIndex === 0);
    const side2 = highlights.find(h => h.position === HighlightPosition.SIDE && h.sideIndex === 1);

    return {
      main: main || null,
      side: [side1 || null, side2 || null],
    };
  }

  async findOne(id: string) {
    const highlight = await this.highlightsRepository.findOne({
      where: { id },
      relations: ['content', 'content.creator'],
    });
    
    if (!highlight) {
      throw new NotFoundException('Highlight not found');
    }
    
    return highlight;
  }

  async update(id: string, data: Partial<{
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
  }>) {
    const highlight = await this.findOne(id);

    // If changing position, deactivate existing at new position
    if (data.position && data.active !== false) {
      if (data.position === HighlightPosition.MAIN) {
        await this.highlightsRepository.update(
          { position: HighlightPosition.MAIN, id: highlight.id ? undefined : highlight.id },
          { active: false },
        );
        await this.highlightsRepository
          .createQueryBuilder()
          .update()
          .set({ active: false })
          .where('position = :position AND id != :id', { 
            position: HighlightPosition.MAIN, 
            id: highlight.id 
          })
          .execute();
      } else if (data.position === HighlightPosition.SIDE && data.sideIndex !== undefined) {
        await this.highlightsRepository
          .createQueryBuilder()
          .update()
          .set({ active: false })
          .where('position = :position AND sideIndex = :sideIndex AND id != :id', { 
            position: HighlightPosition.SIDE, 
            sideIndex: data.sideIndex,
            id: highlight.id 
          })
          .execute();
      }
    }

    Object.assign(highlight, data);
    return this.highlightsRepository.save(highlight);
  }

  async remove(id: string) {
    const highlight = await this.findOne(id);
    await this.highlightsRepository.remove(highlight);
    return { success: true };
  }

  async toggleActive(id: string) {
    const highlight = await this.findOne(id);
    highlight.active = !highlight.active;
    
    // If activating, deactivate others at same position
    if (highlight.active) {
      if (highlight.position === HighlightPosition.MAIN) {
        await this.highlightsRepository
          .createQueryBuilder()
          .update()
          .set({ active: false })
          .where('position = :position AND id != :id', { 
            position: HighlightPosition.MAIN, 
            id: highlight.id 
          })
          .execute();
      } else if (highlight.position === HighlightPosition.SIDE) {
        await this.highlightsRepository
          .createQueryBuilder()
          .update()
          .set({ active: false })
          .where('position = :position AND sideIndex = :sideIndex AND id != :id', { 
            position: HighlightPosition.SIDE, 
            sideIndex: highlight.sideIndex,
            id: highlight.id 
          })
          .execute();
      }
    }
    
    return this.highlightsRepository.save(highlight);
  }
}
