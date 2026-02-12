import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Song } from './song.entity';
import { Album } from './album.entity';
import { Playlist } from './playlist.entity';

export enum UserRole {
  USER = 'user',
  CREATOR = 'creator',
  RESIDENT = 'resident',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  displayName: string;

  @Column({ nullable: true, type: 'text' })
  bio: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  bannerUrl: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  lastActiveAt: Date;

  @Column('simple-array', { nullable: true })
  genres: string[];

  @Column({ nullable: true })
  nextShow: string;

  @OneToMany(() => Song, (song) => song.creator)
  songs: Song[];

  @OneToMany(() => Album, (album) => album.creator)
  albums: Album[];

  @OneToMany(() => Playlist, (playlist) => playlist.creator)
  playlists: Playlist[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

