import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramService } from './program.service';
import { ProgramController } from './program.controller';
import { ProgramShow, Episode } from '../../entities/program-show.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProgramShow, Episode])],
  controllers: [ProgramController],
  providers: [ProgramService],
  exports: [ProgramService],
})
export class ProgramModule {}

