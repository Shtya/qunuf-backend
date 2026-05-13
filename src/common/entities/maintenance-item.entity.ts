import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CoreEntity } from './coreEntity';
import { Property } from './property.entity';
import { ServiceCategory } from './service-provider.entity';

export enum MaintenancePriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

@Entity('maintenance_items')
export class MaintenanceItem extends CoreEntity {
    @Column({ name: 'name' })
    name: string;

    @Column({ type: 'text', nullable: true, name: 'description' })
    description: string;

    @Column({ nullable: true, name: 'location' })
    location: string;

    @Column({ nullable: true, name: 'unit_number' })
    unitNumber: string;

    @Column({
        type: 'enum',
        enum: MaintenancePriority,
        default: MaintenancePriority.MEDIUM,
        name: 'priority',
    })
    priority: MaintenancePriority;

    @Column({ type: 'enum', enum: ServiceCategory, name: 'category' })
    category: ServiceCategory;

    @ManyToOne(() => Property, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'property_id' })
    property: Property;

    @Column({ type: 'uuid', name: 'property_id' })
    propertyId: string;
}
