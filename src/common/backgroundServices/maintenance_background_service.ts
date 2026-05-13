import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MaintenanceService } from 'src/modules/maintenance/maintenance.service';

@Injectable()
export class MaintenanceBackgroundService {
    private readonly logger = new Logger(MaintenanceBackgroundService.name);

    constructor(private readonly maintenanceService: MaintenanceService) {}

    // Every day at 01:00 — mark past-due work orders as overdue
    @Cron(CronExpression.EVERY_DAY_AT_1AM)
    async markOverdueWorkOrders() {
        try {
            const count = await this.maintenanceService.markOverdueWorkOrders();
            if (count > 0) {
                this.logger.log(`Marked ${count} work order(s) as overdue`);
            }
        } catch (err) {
            this.logger.error('Failed to mark overdue work orders', err);
        }
    }

    // Every day at 08:00 — send upcoming maintenance reminders
    @Cron(CronExpression.EVERY_DAY_AT_8AM)
    async sendUpcomingReminders() {
        try {
            await this.maintenanceService.sendUpcomingReminders();
            this.logger.log('Sent upcoming maintenance reminders');
        } catch (err) {
            this.logger.error('Failed to send maintenance reminders', err);
        }
    }

    // Every day at 00:30 — advance recurring schedules whose next_run_date has passed
    @Cron('30 0 * * *')
    async advanceRecurringSchedules() {
        try {
            await this.maintenanceService.advanceRecurringSchedules();
            this.logger.log('Advanced recurring maintenance schedules');
        } catch (err) {
            this.logger.error('Failed to advance recurring schedules', err);
        }
    }
}
