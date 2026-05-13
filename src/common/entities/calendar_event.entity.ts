import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CoreEntity } from './coreEntity';
import { User } from './user.entity';

export enum CalendarEventType {
    CUSTOM = 'custom',
    REMINDER = 'reminder',
    MAINTENANCE = 'maintenance',
}

@Entity('calendar_events')
export class CalendarEvent extends CoreEntity {

    @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'uuid', name: 'user_id' })
    userId: string;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ type: 'timestamptz', name: 'start_date' })
    startDate: Date;

    @Column({ type: 'timestamptz', name: 'end_date', nullable: true })
    endDate: Date | null;

    @Column({ type: 'boolean', name: 'all_day', default: false })
    allDay: boolean;

    @Column({ type: 'varchar', length: 20, nullable: true })
    color: string | null;

    @Column({
        type: 'enum',
        enum: CalendarEventType,
        name: 'event_type',
        default: CalendarEventType.CUSTOM,
    })
    eventType: CalendarEventType;

    @Column({ type: 'varchar', length: 500, nullable: true })
    url: string | null;
}
