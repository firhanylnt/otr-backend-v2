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
import { Album } from './album.entity';
import { Playlist } from './playlist.entity';

export enum SongStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
  HIDDEN = 'hidden',
}

@Entity('songs')
export class Song {
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

  @Column({ nullable: true })
  audioUrl: string;

  @Column({ nullable: true })
  duration: string;

  @Column({ default: 0 })
  plays: number;

  @Column({ default: 0 })
  likes: number;

  @Column({
    type: 'enum',
    enum: SongStatus,
    default: SongStatus.DRAFT,
  })
  status: SongStatus;

  @Column({ nullable: true, type: 'text' })
  rejectionReason: string;

  @ManyToOne(() => User, (user) => user.songs, { nullable: true })
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @Column({ nullable: true })
  creatorId: string;

  @ManyToMany(() => Genre)
  @JoinTable({
    name: 'song_genres',
    joinColumn: { name: 'songId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'genreId', referencedColumnName: 'id' },
  })
  genres: Genre[];

  @ManyToMany(() => Mood)
  @JoinTable({
    name: 'song_moods',
    joinColumn: { name: 'songId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'moodId', referencedColumnName: 'id' },
  })
  moods: Mood[];

  @ManyToMany(() => Album, (album) => album.songs)
  albums: Album[];

  @ManyToMany(() => Playlist, (playlist) => playlist.songs)
  playlists: Playlist[];

  @Column({ nullable: true })
  reviewedBy: string;

  @Column({ nullable: true })
  reviewedAt: Date;

  @Column({ nullable: true })
  publishedAt: Date;

  @Column({ nullable: true })
  label: string;

  @Column({ default: false })
  isOtrPick: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

