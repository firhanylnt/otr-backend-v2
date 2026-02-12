import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Genre } from './genre.entity';
import { Mood } from './mood.entity';
import { Song } from './song.entity';

export enum PlaylistStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  HIDDEN = 'hidden',
}

@Entity('playlists')
export class Playlist {
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

  @Column({ default: 0 })
  plays: number;

  @Column({ default: 0 })
  likes: number;

  @Column({
    type: 'enum',
    enum: PlaylistStatus,
    default: PlaylistStatus.DRAFT,
  })
  status: PlaylistStatus;

  @ManyToOne(() => User, (user) => user.playlists, { nullable: true })
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @Column({ nullable: true })
  creatorId: string;

  @ManyToMany(() => Genre)
  @JoinTable({
    name: 'playlist_genres',
    joinColumn: { name: 'playlistId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'genreId', referencedColumnName: 'id' },
  })
  genres: Genre[];

  @ManyToMany(() => Mood)
  @JoinTable({
    name: 'playlist_moods',
    joinColumn: { name: 'playlistId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'moodId', referencedColumnName: 'id' },
  })
  moods: Mood[];

  @ManyToMany(() => Song, (song) => song.playlists)
  @JoinTable({
    name: 'playlist_songs',
    joinColumn: { name: 'playlistId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'songId', referencedColumnName: 'id' },
  })
  songs: Song[];

  @Column({ default: false })
  isOtrPick: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ nullable: true })
  publishedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

