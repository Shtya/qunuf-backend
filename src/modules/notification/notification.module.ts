import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/common/entities/user.entity';
import { Notification } from 'src/common/entities/notification.entity';
import { NotificationSubscriber } from './NotificationSubscriber';
import { AppGateway } from 'src/common/websocket/app.gateway';


@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User])],
  controllers: [NotificationController],
  providers: [NotificationService, AppGateway, NotificationSubscriber],
  exports: [NotificationService]
})
export class NotificationModule { }
