import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HighlightsService } from './highlights.service';
import { HighlightsController } from './highlights.controller';
import { Highlight } from '../../entities/highlight.entity';
import { Song } from '../../entities/song.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Highlight, Song])],
  controllers: [HighlightsController],
  providers: [HighlightsService],
  exports: [HighlightsService],
})
export class HighlightsModule {}
