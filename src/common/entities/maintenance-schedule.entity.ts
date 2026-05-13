import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CoreEntity } from './coreEntity';
import { Property } from './property.entity';
import { MaintenanceItem } from './maintenance-item.entity';
import { ServiceProvider } from './service-provider.entity';
import { User } from './user.entity';

export enum RecurrenceType {
    ONCE = 'once',
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
    ANNUALLY = 'annually',
}

export enum ScheduleStatus {
    ACTIVE = 'active',
    PAUSED = 'paused',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

@Entity('maintenance_schedules')
export class MaintenanceSchedule extends CoreEntity {
    @Column({ name: 'title' })
    title: string;

    @Column({ type: 'text', nullable: true, name: 'description' })
    description: string;

    @Column({ type: 'timestamptz', name: 'start_date' })
    startDate: Date;

    @Column({ type: 'timestamptz', nullable: true, name: 'end_date' })
    endDate: Date;

    @Column({
        type: 'enum',
        enum: RecurrenceType,
        default: RecurrenceType.ONCE,
        name: 'recurrence_type',
    })
    recurrenceType: RecurrenceType;

    @Column({ type: 'int', nullable: true, name: 'recurrence_interval' })
    recurrenceInterval: number;

    @Column({ type: 'timestamptz', nullable: true, name: 'next_run_date' })
    nextRunDate: Date;

    @Column({
        type: 'enum',
        enum: ScheduleStatus,
        default: ScheduleStatus.ACTIVE,
        name: 'status',
    })
    status: ScheduleStatus;

    @Column({
        type: 'int',
        array: true,
        nullable: true,
        name: 'notification_days_before',
    })
    notificationDaysBefore: number[];

    @ManyToOne(() => Property, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'property_id' })
    property: Property;

    @Column({ type: 'uuid', name: 'property_id' })
    propertyId: string;

    @ManyToOne(() => MaintenanceItem, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'maintenance_item_id' })
    maintenanceItem: MaintenanceItem;

    @Column({ type: 'uuid', nullable: true, name: 'maintenance_item_id' })
    maintenanceItemId: string;

    @ManyToOne(() => ServiceProvider, { nullable: true, onDelete: 'SET NULL', eager: true })
    @JoinColumn({ name: 'provider_id' })
    provider: ServiceProvider;

    @Column({ type: 'uuid', nullable: true, name: 'provider_id' })
    providerId: string;

    @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'created_by_id' })
    createdBy: User;

    @Column({ type: 'uuid', nullable: true, name: 'created_by_id' })
    createdById: string;
}
