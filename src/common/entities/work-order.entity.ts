import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CoreEntity } from './coreEntity';
import { Property } from './property.entity';
import { MaintenanceSchedule } from './maintenance-schedule.entity';
import { ServiceProvider } from './service-provider.entity';
import { User } from './user.entity';
import { MaintenancePriority } from './maintenance-item.entity';
import { ServiceCategory } from './service-provider.entity';

export enum WorkOrderStatus {
    SCHEDULED = 'scheduled',
    // kept for DB enum compat only — no longer used in application flow
    PENDING_PROVIDER_CONFIRMATION = 'pending_provider_confirmation',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CLOSED = 'closed',
    OVERDUE = 'overdue',
    CANCELLED = 'cancelled',
}

@Entity('work_orders')
export class WorkOrder extends CoreEntity {
    @Column({ name: 'title' })
    title: string;

    @Column({ type: 'text', nullable: true, name: 'description' })
    description: string;

    @Column({
        type: 'enum',
        enum: WorkOrderStatus,
        default: WorkOrderStatus.SCHEDULED,
        name: 'status',
    })
    status: WorkOrderStatus;

    @Column({
        type: 'enum',
        enum: MaintenancePriority,
        default: MaintenancePriority.MEDIUM,
        name: 'priority',
    })
    priority: MaintenancePriority;

    @Column({ type: 'enum', enum: ServiceCategory, nullable: true, name: 'category' })
    category: ServiceCategory;

    @Column({ type: 'timestamptz', nullable: true, name: 'due_date' })
    dueDate: Date | null;

    @Column({ type: 'timestamptz', nullable: true, name: 'completed_date' })
    completedDate: Date;

    @Column({ type: 'text', nullable: true, name: 'notes' })
    notes: string;

    @Column({ type: 'jsonb', nullable: true, name: 'attachments' })
    attachments: { url: string; filename: string }[] | null;

    @Column({ type: 'int', nullable: true, name: 'tenant_rating' })
    tenantRating: number;

    @Column({ type: 'text', nullable: true, name: 'tenant_rating_comment' })
    tenantRatingComment: string | null;

    @Column({ type: 'boolean', default: false, name: 'tenant_access_approved' })
    tenantAccessApproved: boolean;

    @ManyToOne(() => Property, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'property_id' })
    property: Property;

    @Column({ type: 'uuid', name: 'property_id' })
    propertyId: string;

    @ManyToOne(() => MaintenanceSchedule, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'schedule_id' })
    schedule: MaintenanceSchedule;

    @Column({ type: 'uuid', nullable: true, name: 'schedule_id' })
    scheduleId: string;

    @ManyToOne(() => ServiceProvider, { nullable: true, onDelete: 'SET NULL', eager: true })
    @JoinColumn({ name: 'provider_id' })
    provider: ServiceProvider;

    @Column({ type: 'uuid', nullable: true, name: 'provider_id' })
    providerId: string | null;

    @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true, eager: true })
    @JoinColumn({ name: 'created_by_id' })
    createdBy: User;

    @Column({ type: 'uuid', nullable: true, name: 'created_by_id' })
    createdById: string;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'assigned_tenant_id' })
    assignedTenant: User;

    @Column({ type: 'uuid', nullable: true, name: 'assigned_tenant_id' })
    assignedTenantId: string;
}
