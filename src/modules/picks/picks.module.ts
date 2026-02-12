import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PicksService } from './picks.service';
import { PicksController } from './picks.controller';
import { Pick } from '../../entities/pick.entity';
import { Song } from '../../entities/song.entity';
import { Album } from '../../entities/album.entity';
import { Playlist } from '../../entities/playlist.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pick, Song, Album, Playlist])],
  controllers: [PicksController],
  providers: [PicksService],
  exports: [PicksService],
})
export class PicksModule {}

