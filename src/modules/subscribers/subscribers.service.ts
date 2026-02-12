import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscriber, SubscriberStatus } from '../../entities/subscriber.entity';

@Injectable()
export class SubscribersService {
  constructor(
    @InjectRepository(Subscriber)
    private subscribersRepository: Repository<Subscriber>,
  ) {}

  async subscribe(email: string, name?: string, source?: string) {
    const existing = await this.subscribersRepository.findOne({ where: { email } });
    if (existing) {
      if (existing.status === SubscriberStatus.UNSUBSCRIBED) {
        existing.status = SubscriberStatus.ACTIVE;
        existing.unsubscribedAt = null as unknown as Date;
        return this.subscribersRepository.save(existing);
      }
      throw new ConflictException('Email already subscribed');
    }

    const subscriber = this.subscribersRepository.create({
      email,
      name,
      source,
      status: SubscriberStatus.ACTIVE,
    });
    return this.subscribersRepository.save(subscriber);
  }

  async unsubscribe(email: string) {
    const subscriber = await this.subscribersRepository.findOne({ where: { email } });
    if (!subscriber) {
      throw new NotFoundException('Subscriber not found');
    }
    subscriber.status = SubscriberStatus.UNSUBSCRIBED;
    subscriber.unsubscribedAt = new Date();
    return this.subscribersRepository.save(subscriber);
  }

  async findAll(options?: { status?: string; search?: string; page?: number; limit?: number }) {
    const { status, search, page = 1, limit = 20 } = options || {};
    const query = this.subscribersRepository.createQueryBuilder('subscriber');

    if (status && status !== 'all') {
      query.where('subscriber.status = :status', { status });
    }

    if (search && search !== 'undefined' && search.trim() !== '') {
      query.andWhere(
        '(subscriber.email ILIKE :search OR subscriber.name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const total = await query.getCount();
    const subscribers = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('subscriber.subscribedAt', 'DESC')
      .getMany();

    return {
      data: subscribers,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getStats() {
    const total = await this.subscribersRepository.count();
    const active = await this.subscribersRepository.count({
      where: { status: SubscriberStatus.ACTIVE },
    });
    const unsubscribed = await this.subscribersRepository.count({
      where: { status: SubscriberStatus.UNSUBSCRIBED },
    });

    return { total, active, unsubscribed };
  }

  async findOne(id: string) {
    const subscriber = await this.subscribersRepository.findOne({ where: { id } });
    if (!subscriber) {
      throw new NotFoundException('Subscriber not found');
    }
    return subscriber;
  }

  async update(id: string, updateSubscriberDto: any) {
    const subscriber = await this.subscribersRepository.findOne({ where: { id } });
    if (!subscriber) {
      throw new NotFoundException('Subscriber not found');
    }

    if (updateSubscriberDto.name) subscriber.name = updateSubscriberDto.name;
    if (updateSubscriberDto.email) subscriber.email = updateSubscriberDto.email;
    if (updateSubscriberDto.status) subscriber.status = updateSubscriberDto.status;
    if (updateSubscriberDto.source) subscriber.source = updateSubscriberDto.source;

    await this.subscribersRepository.save(subscriber);
    return subscriber;
  }

  async remove(id: string) {
    const subscriber = await this.subscribersRepository.findOne({ where: { id } });
    if (!subscriber) {
      throw new NotFoundException('Subscriber not found');
    }
    await this.subscribersRepository.remove(subscriber);
    return { success: true };
  }
}

