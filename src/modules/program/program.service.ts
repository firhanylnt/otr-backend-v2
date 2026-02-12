import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgramShow, Episode } from '../../entities/program-show.entity';

@Injectable()
export class ProgramService {
  constructor(
    @InjectRepository(ProgramShow)
    private showsRepository: Repository<ProgramShow>,
    @InjectRepository(Episode)
    private episodesRepository: Repository<Episode>,
  ) {}

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
  }

  // ============ PROGRAM CRUD ============

  async create(data: Partial<ProgramShow>) {
    const show = this.showsRepository.create({
      ...data,
      slug: this.generateSlug(data.title!),
    });
    return this.showsRepository.save(show);
  }

  async findAll(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    return this.showsRepository.find({
      where,
      relations: ['host', 'episodes'],
      order: { createdAt: 'DESC' },
    });
  }

  async getSchedule() {
    const shows = await this.findAll();
    const schedule: { [key: number]: ProgramShow[] } = {};
    
    for (let i = 0; i < 7; i++) {
      schedule[i] = shows.filter(s => s.dayOfWeek === i);
    }
    
    return schedule;
  }

  async findOne(id: string) {
    const show = await this.showsRepository.findOne({
      where: { id },
      relations: ['host', 'episodes'],
    });
    if (!show) {
      throw new NotFoundException('Program not found');
    }
    return show;
  }

  async findBySlug(slug: string) {
    const show = await this.showsRepository.findOne({
      where: { slug },
      relations: ['host', 'episodes'],
    });
    if (!show) {
      throw new NotFoundException('Program not found');
    }
    return show;
  }

  async update(id: string, data: Partial<ProgramShow>) {
    const show = await this.findOne(id);
    Object.assign(show, data);
    return this.showsRepository.save(show);
  }

  async remove(id: string) {
    const show = await this.findOne(id);
    await this.showsRepository.remove(show);
    return { success: true };
  }

  // ============ EPISODE CRUD ============

  async createEpisode(programId: string, data: Partial<Episode>) {
    const program = await this.findOne(programId);
    
    // Get episode count for numbering
    const episodeCount = await this.episodesRepository.count({
      where: { programId }
    });
    
    const episode = this.episodesRepository.create({
      ...data,
      programId,
      slug: this.generateSlug(data.title || `episode-${episodeCount + 1}`),
      episodeNumber: data.episodeNumber || episodeCount + 1,
    });
    
    return this.episodesRepository.save(episode);
  }

  async findAllEpisodes(programId: string) {
    return this.episodesRepository.find({
      where: { programId },
      order: { episodeNumber: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOneEpisode(id: string) {
    const episode = await this.episodesRepository.findOne({
      where: { id },
      relations: ['program'],
    });
    if (!episode) {
      throw new NotFoundException('Episode not found');
    }
    return episode;
  }

  async updateEpisode(id: string, data: Partial<Episode>) {
    const episode = await this.findOneEpisode(id);
    Object.assign(episode, data);
    return this.episodesRepository.save(episode);
  }

  async removeEpisode(id: string) {
    const episode = await this.findOneEpisode(id);
    await this.episodesRepository.remove(episode);
    return { success: true };
  }

  // Bulk create episodes (for adding multiple at once)
  async createBulkEpisodes(programId: string, episodes: Partial<Episode>[]) {
    const program = await this.findOne(programId);
    
    const currentCount = await this.episodesRepository.count({
      where: { programId }
    });
    
    const newEpisodes = episodes.map((ep, index) => 
      this.episodesRepository.create({
        ...ep,
        programId,
        slug: this.generateSlug(ep.title || `episode-${currentCount + index + 1}`),
        episodeNumber: ep.episodeNumber || currentCount + index + 1,
      })
    );
    
    return this.episodesRepository.save(newEpisodes);
  }
}
