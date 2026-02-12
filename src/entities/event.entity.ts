import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EventStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  PAST = 'past',
  CANCELLED = 'cancelled',
}

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  coverUrl: string;

  @Column({ nullable: true })
  bannerUrl: string;

  @Column()
  venue: string;

  @Column({ nullable: true })
  address: string;

  @Column()
  location: string;

  @Column()
  eventDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @Column()
  time: string;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ nullable: true })
  ticketUrl: string;

  @Column({ nullable: true })
  price: string;

  @Column({ default: false })
  isFree: boolean;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.UPCOMING,
  })
  status: EventStatus;

  @Column('simple-json', { nullable: true })
  lineup: { name: string; role: string; avatar?: string }[];

  @Column('simple-array', { nullable: true })
  gallery: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

