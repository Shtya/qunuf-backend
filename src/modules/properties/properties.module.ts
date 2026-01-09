import { Module } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { User } from 'src/common/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from 'src/common/entities/property.entity';
import { State } from 'src/common/entities/state.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Property, User, State])],
  controllers: [PropertiesController],
  providers: [PropertiesService],
})
export class PropertiesModule { }
