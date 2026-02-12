import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PickType {
  SONG = 'song',
  ALBUM = 'album',
  PLAYLIST = 'playlist',
  MIXTAPE = 'mixtape',
}

@Entity('otr_picks')
export class Pick {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: PickType,
  })
  contentType: PickType;

  @Column()
  contentId: string;

  @Column({ nullable: true, type: 'text' })
  curatorNote: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

