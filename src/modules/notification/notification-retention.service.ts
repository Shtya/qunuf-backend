import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationService } from './notification.service';

@Injectable()
export class NotificationRetentionService {
  private readonly logger = new Logger(NotificationRetentionService.name);

  constructor(private readonly notificationService: NotificationService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyNotificationCleanup() {
    this.logger.log('Starting notification retention cleanup...');

    const removedCount = await this.notificationService.deleteOldNotifications();

    if (removedCount > 0) {
      this.logger.log(`Deleted ${removedCount} notifications older than 3 months.`);
    } else {
      this.logger.log('No notifications older than 3 months were found.');
    }
  }
}
