import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Genre } from '../../entities/genre.entity';

@Injectable()
export class GenresService {
  constructor(
    @InjectRepository(Genre)
    private genresRepository: Repository<Genre>,
  ) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async create(data: Partial<Genre>) {
    const slug = this.generateSlug(data.name!);
    const existing = await this.genresRepository.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException('Genre with this name already exists');
    }
    const genre = this.genresRepository.create({ ...data, slug });
    return this.genresRepository.save(genre);
  }

  async findAll(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    return this.genresRepository.find({
      where,
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const genre = await this.genresRepository.findOne({ where: { id } });
    if (!genre) {
      throw new NotFoundException('Genre not found');
    }
    return genre;
  }

  async findBySlug(slug: string) {
    const genre = await this.genresRepository.findOne({ where: { slug } });
    if (!genre) {
      throw new NotFoundException('Genre not found');
    }
    return genre;
  }

  async update(id: string, data: Partial<Genre>) {
    const genre = await this.findOne(id);
    if (data.name && data.name !== genre.name) {
      data.slug = this.generateSlug(data.name);
    }
    Object.assign(genre, data);
    return this.genresRepository.save(genre);
  }

  async toggleActive(id: string) {
    const genre = await this.findOne(id);
    genre.isActive = !genre.isActive;
    return this.genresRepository.save(genre);
  }

  async remove(id: string) {
    const genre = await this.findOne(id);
    await this.genresRepository.remove(genre);
    return { success: true };
  }
}

