import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreatorsService } from './creators.service';
import { CreatorsController } from './creators.controller';
import { User } from '../../entities/user.entity';
import { ListeningHistory } from '../../entities/listening-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, ListeningHistory])],
  controllers: [CreatorsController],
  providers: [CreatorsService],
  exports: [CreatorsService],
})
export class CreatorsModule {}

