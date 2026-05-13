import { Entity, Column } from 'typeorm';
import { CoreEntity } from './coreEntity';

export enum ServiceCategory {
    ELECTRICAL = 'electrical',
    PLUMBING = 'plumbing',
    HVAC = 'hvac',
    CARPENTRY = 'carpentry',
    PAINTING = 'painting',
    CLEANING = 'cleaning',
    SECURITY = 'security',
    LANDSCAPING = 'landscaping',
    GENERAL = 'general',
    OTHER = 'other',
}

export enum ProviderStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
}

@Entity('service_providers')
export class ServiceProvider extends CoreEntity {
    @Column({ name: 'name' })
    name: string;

    @Column({ nullable: true, name: 'email' })
    email: string;

    @Column({ name: 'phone' })
    phone: string;

    @Column({
        type: 'enum',
        enum: ServiceCategory,
        name: 'service_category',
    })
    serviceCategory: ServiceCategory;

    @Column({ type: 'text', nullable: true, name: 'description' })
    description: string;

    @Column({
        type: 'enum',
        enum: ProviderStatus,
        default: ProviderStatus.ACTIVE,
        name: 'status',
    })
    status: ProviderStatus;

    @Column({ type: 'int', nullable: true, name: 'sla_hours' })
    slaHours: number;

    @Column({
        type: 'decimal',
        precision: 3,
        scale: 2,
        nullable: true,
        default: null,
        name: 'average_rating',
    })
    averageRating: number | null;

    @Column({ nullable: true, name: 'address' })
    address: string;
}
