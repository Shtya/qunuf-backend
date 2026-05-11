import { Module } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { User } from 'src/common/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from 'src/common/entities/property.entity';
import { State } from 'src/common/entities/state.entity';
import { Settings } from 'src/common/entities/settings.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Property, User, State]),
    NotificationModule
  ],

  controllers: [PropertiesController],
  providers: [PropertiesService],
})
export class PropertiesModule { }
