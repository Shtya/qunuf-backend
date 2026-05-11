import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CoreEntity } from './coreEntity';
import { Contract } from './contract.entity';
import { Property } from './property.entity';
import { User } from './user.entity';

@Entity('reviews')
export class Review extends CoreEntity {
    @ManyToOne(() => Contract, { nullable: false })
    @JoinColumn({ name: 'contract_id' })
    contract: Contract;

    @Column({ type: 'uuid', name: 'contract_id' })
    contractId: string;

    @ManyToOne(() => Property, { nullable: false })
    @JoinColumn({ name: 'property_id' })
    property: Property;

    @Column({ type: 'uuid', name: 'property_id' })
    propertyId: string;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'tenant_id' })
    tenant: User;

    @Column({ type: 'uuid', name: 'tenant_id' })
    tenantId: string;

    @Column({ type: 'int', name: 'rate' })
    rate: number; // Rating from 1 to 5

    @Column({ type: 'text', name: 'review_text', nullable: true })
    reviewText: string | null;
}
