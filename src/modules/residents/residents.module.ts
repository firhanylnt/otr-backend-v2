import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResidentsService } from './residents.service';
import { ResidentsController } from './residents.controller';
import { User } from '../../entities/user.entity';
import { ListeningHistory } from '../../entities/listening-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, ListeningHistory])],
  controllers: [ResidentsController],
  providers: [ResidentsService],
  exports: [ResidentsService],
})
export class ResidentsModule {}

