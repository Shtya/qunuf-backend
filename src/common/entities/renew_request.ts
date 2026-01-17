// modules/contracts/entities/renew-request.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Contract } from './contract.entity';
import { CoreEntity } from './coreEntity';
import { User } from './user.entity';
import { Property } from './property.entity';


export enum RenewStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
    EXPIRED = 'EXPIRED'
}

@Entity('renew_requests')
export class RenewRequest extends CoreEntity {

    @ManyToOne(() => Contract, { nullable: false })
    @JoinColumn({ name: 'original_contract_id' })
    @Index({ unique: true }) // منع تكرار طلبات التجديد لنفس العقد
    originalContract: Contract;

    @Column({ type: 'uuid', name: 'original_contract_id' })
    originalContractId: string;

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

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    offeredDiscountAmount: number;

    @Column({ type: 'enum', enum: RenewStatus, default: RenewStatus.PENDING })
    status: RenewStatus;

    @Column({ type: 'text', nullable: true })
    adminNotes: string;
}