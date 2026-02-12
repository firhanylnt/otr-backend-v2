import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Song } from './song.entity';

export enum HighlightPosition {
  MAIN = 'main',
  SIDE = 'side',
}

@Entity('highlights')
export class Highlight {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: HighlightPosition,
  })
  position: HighlightPosition;

  @Column({ nullable: true, default: 0 })
  sideIndex: number; // 0 or 1 for side positions

  @Column({ nullable: true })
  contentId: string;

  @ManyToOne(() => Song, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'contentId' })
  content: Song;

  @Column()
  title: string;

  @Column({ nullable: true })
  artist: string;

  @Column({ nullable: true })
  image: string;

  @Column({ nullable: true })
  customImage: string;

  @Column({ default: 'HIGHLIGHT' })
  tag: string;

  @Column({ default: 'CUSTOM' })
  type: string;

  @Column({ nullable: true })
  link: string;

  @Column({ default: true })
  active: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
