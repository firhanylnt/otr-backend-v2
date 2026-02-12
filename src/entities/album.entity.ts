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

export enum AlbumStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
  HIDDEN = 'hidden',
}

export enum AlbumType {
  ALBUM = 'album',
  MIXTAPE = 'mixtape',
  EP = 'ep',
}

@Entity('albums')
export class Album {
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

  @Column({
    type: 'enum',
    enum: AlbumType,
    default: AlbumType.ALBUM,
  })
  type: AlbumType;

  @Column({ default: 0 })
  plays: number;

  @Column({ default: 0 })
  likes: number;

  @Column({
    type: 'enum',
    enum: AlbumStatus,
    default: AlbumStatus.DRAFT,
  })
  status: AlbumStatus;

  @ManyToOne(() => User, (user) => user.albums, { nullable: true })
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @Column({ nullable: true })
  creatorId: string;

  @ManyToMany(() => Genre)
  @JoinTable({
    name: 'album_genres',
    joinColumn: { name: 'albumId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'genreId', referencedColumnName: 'id' },
  })
  genres: Genre[];

  @ManyToMany(() => Mood)
  @JoinTable({
    name: 'album_moods',
    joinColumn: { name: 'albumId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'moodId', referencedColumnName: 'id' },
  })
  moods: Mood[];

  @ManyToMany(() => Song, (song) => song.albums)
  @JoinTable({
    name: 'album_songs',
    joinColumn: { name: 'albumId', referencedColumnName: 'id' },
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

