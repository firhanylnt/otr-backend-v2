import { IsNotEmpty, IsOptional, IsArray, MaxLength, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SongStatus } from '../../../entities/song.entity';

export class CreateSongDto {
  @ApiProperty({ example: 'Midnight Frequencies' })
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty({ example: 'A journey through late-night sounds...' })
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: 'https://example.com/cover.jpg' })
  @IsOptional()
  coverUrl?: string;

  @ApiProperty({ example: 'https://example.com/banner.jpg' })
  @IsOptional()
  bannerUrl?: string;

  @ApiProperty({ example: 'https://example.com/audio.mp3' })
  @IsOptional()
  audioUrl?: string;

  @ApiProperty({ example: '4:32' })
  @IsOptional()
  duration?: string;

  @ApiProperty({ example: 'OTR Records' })
  @IsOptional()
  @MaxLength(100)
  label?: string;

  @ApiProperty({ example: ['uuid1', 'uuid2'] })
  @IsOptional()
  @IsArray()
  genreIds?: string[];

  @ApiProperty({ example: ['uuid1', 'uuid2'] })
  @IsOptional()
  @IsArray()
  moodIds?: string[];

  @ApiProperty({ example: 'published', enum: SongStatus })
  @IsOptional()
  @IsEnum(SongStatus)
  status?: SongStatus;
}

