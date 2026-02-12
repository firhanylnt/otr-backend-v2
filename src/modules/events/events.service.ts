import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Event, EventStatus } from '../../entities/event.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
  ) {}

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
  }

  async create(data: Partial<Event>) {
    const event = this.eventsRepository.create({
      ...data,
      slug: this.generateSlug(data.title!),
    });
    return this.eventsRepository.save(event);
  }

  async findAll(options?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, search, page = 1, limit = 20 } = options || {};
    const query = this.eventsRepository.createQueryBuilder('event');

    if (status && status !== 'all') {
      query.where('event.status = :status', { status });
    }

    if (search) {
      query.andWhere(
        '(event.title ILIKE :search OR event.venue ILIKE :search OR event.location ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const total = await query.getCount();
    const events = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('event.eventDate', 'DESC')
      .getMany();

    return {
      data: events,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findUpcoming() {
    return this.eventsRepository.find({
      where: { status: EventStatus.UPCOMING },
      order: { eventDate: 'ASC' },
    });
  }

  async findPast(limit = 10) {
    return this.eventsRepository.find({
      where: { status: EventStatus.PAST },
      order: { eventDate: 'DESC' },
      take: limit,
    });
  }

  async findOne(id: string) {
    const event = await this.eventsRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  async findBySlug(slug: string) {
    const event = await this.eventsRepository.findOne({ where: { slug } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  async update(id: string, data: Partial<Event>) {
    const event = await this.findOne(id);
    Object.assign(event, data);
    return this.eventsRepository.save(event);
  }

  async remove(id: string) {
    const event = await this.findOne(id);
    await this.eventsRepository.remove(event);
    return { success: true };
  }

  async updateStatuses() {
    const now = new Date();
    // Update past events
    await this.eventsRepository
      .createQueryBuilder()
      .update(Event)
      .set({ status: EventStatus.PAST })
      .where('eventDate < :now', { now })
      .andWhere('status != :past', { past: EventStatus.PAST })
      .andWhere('status != :cancelled', { cancelled: EventStatus.CANCELLED })
      .execute();
  }
}

