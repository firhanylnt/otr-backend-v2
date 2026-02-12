import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SongsService } from './songs.service';
import { SongsController } from './songs.controller';
import { Song } from '../../entities/song.entity';
import { Genre } from '../../entities/genre.entity';
import { Mood } from '../../entities/mood.entity';
import { User } from '../../entities/user.entity';
import { ListeningHistory } from '../../entities/listening-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Song, Genre, Mood, User, ListeningHistory])],
  controllers: [SongsController],
  providers: [SongsService],
  exports: [SongsService],
})
export class SongsModule {}

