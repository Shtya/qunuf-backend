import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { ServiceProvider } from 'src/common/entities/service-provider.entity';
import { MaintenanceItem } from 'src/common/entities/maintenance-item.entity';
import { MaintenanceSchedule } from 'src/common/entities/maintenance-schedule.entity';
import { WorkOrder } from 'src/common/entities/work-order.entity';
import { Property } from 'src/common/entities/property.entity';
import { User } from 'src/common/entities/user.entity';
import { CalendarEvent } from 'src/common/entities/calendar_event.entity';
import { Contract } from 'src/common/entities/contract.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            ServiceProvider,
            MaintenanceItem,
            MaintenanceSchedule,
            WorkOrder,
            Property,
            User,
            CalendarEvent,
            Contract,
        ]),
        NotificationModule,
    ],
    controllers: [MaintenanceController],
    providers: [MaintenanceService],
    exports: [MaintenanceService],
})
export class MaintenanceModule {}
