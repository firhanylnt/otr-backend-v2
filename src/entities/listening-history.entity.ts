import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Song } from './song.entity';

@Entity('listening_history')
@Index(['userId', 'songId'], { unique: true }) // One record per user-song pair
export class ListeningHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => Song, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'songId' })
  song: Song;

  @Column()
  @Index()
  songId: string;

  // Number of times the user played this song
  @Column({ default: 0 })
  playCount: number;

  // Total duration listened in seconds
  @Column({ type: 'float', default: 0 })
  totalListenedDuration: number;

  // Last playback position in seconds (for resume functionality)
  @Column({ type: 'float', default: 0 })
  lastPosition: number;

  // Song duration for reference
  @Column({ type: 'float', nullable: true })
  songDuration: number;

  // Whether the song was completed (listened > 90%)
  @Column({ default: false })
  completed: boolean;

  // Last time the user listened to this song
  @Column({ nullable: true })
  lastListenedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

