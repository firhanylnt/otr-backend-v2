import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum ShowType {
  LIVE = 'live',
  PRERECORDED = 'prerecorded',
  RERUN = 'rerun',
  PODCAST = 'podcast',
  MIX = 'mix',
}

@Entity('program_shows')
export class ProgramShow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ nullable: true })
  bannerUrl: string;

  @Column({ nullable: true })
  coverUrl: string;

  // Schedule fields
  @Column({ type: 'date', nullable: true })
  scheduleDate: Date; // Specific date for the program

  @Column({ nullable: true })
  scheduleStartTime: string; // HH:MM format

  @Column({ nullable: true })
  scheduleEndTime: string; // HH:MM format

  // Legacy/recurring schedule fields
  @Column({ nullable: true })
  dayOfWeek: number; // 0-6 (Sunday-Saturday)

  @Column({ nullable: true })
  startTime: string; // HH:MM (deprecated, use scheduleStartTime)

  @Column({ nullable: true })
  endTime: string; // HH:MM (deprecated, use scheduleEndTime)

  @Column({
    type: 'enum',
    enum: ShowType,
    default: ShowType.LIVE,
  })
  type: ShowType;

  @Column({ default: true })
  isRecurring: boolean;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'hostId' })
  host: User;

  @Column({ nullable: true })
  hostId: string;

  @Column({ nullable: true })
  hostName: string; // Alternative to relation for simple host name

  @Column('simple-array', { nullable: true })
  genres: string[];

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Episode, episode => episode.program, { cascade: true })
  episodes: Episode[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('program_episodes')
export class Episode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ nullable: true })
  audioUrl: string;

  @Column({ nullable: true })
  duration: string; // e.g., "1:30:00"

  @Column({ nullable: true })
  episodeNumber: number;

  @Column({ type: 'date', nullable: true })
  publishedAt: Date;

  @ManyToOne(() => ProgramShow, program => program.episodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'programId' })
  program: ProgramShow;

  @Column()
  programId: string;

  @Column({ default: true })
  isPublished: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

