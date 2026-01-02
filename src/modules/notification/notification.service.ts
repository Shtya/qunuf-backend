import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from 'src/common/entities/notification.entity';
import { User } from 'src/common/entities/user.entity';
import { Repository } from 'typeorm';


@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    public notificationRepository: Repository<Notification>,

    @InjectRepository(User)
    public userRepository: Repository<User>,
  ) { }


  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (notification) {
      notification.isRead = true;
      await this.notificationRepository.save(notification);
    }

    return notification;
  }

  async markAllAsRead(userId: string) {

    await this.notificationRepository.createQueryBuilder()
      .update(Notification)
      .set({ isRead: true })
      .where('userId = :userId', { userId })
      .andWhere('isRead = :isRead', { isRead: false })
      .execute();


    await this.userRepository.update(userId, {
      notificationUnreadCount: 0
    });

    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(userId: string) {
    // Fetch the user directly to get the cached count
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['notificationUnreadCount']
    });

    return {
      unreadCount: user?.notificationUnreadCount || 0
    };
  }


  async createNotification(userId: string, type: string, title: string, message: string, relatedEntityType?: string, relatedEntityId?: string) {
    const notification = this.notificationRepository.create({
      userId,
      type,
      title,
      message,
      relatedEntityType,
      relatedEntityId,
      isRead: false,
    });

    return this.notificationRepository.save(notification);
  }

  async sendBulkNotification(userIds: string[], type: string, title: string, message: string) {
    const notifications = userIds.map(userId =>
      this.notificationRepository.create({
        userId,
        type,
        title,
        message,
        isRead: false,
      }),
    );

    return this.notificationRepository.save(notifications);
  }
}
