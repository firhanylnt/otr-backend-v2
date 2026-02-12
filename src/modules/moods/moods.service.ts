import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mood } from '../../entities/mood.entity';

@Injectable()
export class MoodsService {
  constructor(
    @InjectRepository(Mood)
    private moodsRepository: Repository<Mood>,
  ) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async create(data: Partial<Mood>) {
    const slug = this.generateSlug(data.name!);
    const existing = await this.moodsRepository.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException('Mood with this name already exists');
    }
    const mood = this.moodsRepository.create({ ...data, slug });
    return this.moodsRepository.save(mood);
  }

  async findAll(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    return this.moodsRepository.find({
      where,
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const mood = await this.moodsRepository.findOne({ where: { id } });
    if (!mood) {
      throw new NotFoundException('Mood not found');
    }
    return mood;
  }

  async findBySlug(slug: string) {
    const mood = await this.moodsRepository.findOne({ where: { slug } });
    if (!mood) {
      throw new NotFoundException('Mood not found');
    }
    return mood;
  }

  async update(id: string, data: Partial<Mood>) {
    const mood = await this.findOne(id);
    if (data.name && data.name !== mood.name) {
      data.slug = this.generateSlug(data.name);
    }
    Object.assign(mood, data);
    return this.moodsRepository.save(mood);
  }

  async toggleActive(id: string) {
    const mood = await this.findOne(id);
    mood.isActive = !mood.isActive;
    return this.moodsRepository.save(mood);
  }

  async remove(id: string) {
    const mood = await this.findOne(id);
    await this.moodsRepository.remove(mood);
    return { success: true };
  }
}

