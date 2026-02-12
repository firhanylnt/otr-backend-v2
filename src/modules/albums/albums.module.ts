import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlbumsService } from './albums.service';
import { AlbumsController } from './albums.controller';
import { Album } from '../../entities/album.entity';
import { Song } from '../../entities/song.entity';
import { Genre } from '../../entities/genre.entity';
import { Mood } from '../../entities/mood.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Album, Song, Genre, Mood])],
  controllers: [AlbumsController],
  providers: [AlbumsService],
  exports: [AlbumsService],
})
export class AlbumsModule {}

