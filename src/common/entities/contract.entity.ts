import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { CommercialSubType, Property, PropertyType, RentType, ResidentialSubType } from './property.entity';
import { CoreEntity } from './coreEntity';

// Interfaces for Type Safety in JSONB Columns
export interface UserSnapshot {
    name: string;
    email: string;
    nationality: string; // Store Country Name, not just ID
    phoneNumber: string;
    identityType: string;
    identityOtherType?: string | null
    identityNumber: string;
    identityIssueCountry: string;  // Store Country Name, not just ID
    birthDate: string;
    shortAddress: string;
}

export interface PropertySnapshot {
    name: string;
    type: PropertyType;
    subType: ResidentialSubType | CommercialSubType | string;
    propertyNumber: string;
    nationalAddressCode: string;
    stateName: string; // Store State Name
    area: number;

    // Added Specification Columns 
    capacity?: number;
    isFurnished: boolean;
    constructionDate: Date;
    complexName?: string;
    insurancePolicyNumber?: string;
    ownershipType: string;

    // Meter Numbers
    electricityMeter?: string;
    waterMeter?: string;
    gasMeter?: string;

    // --- Facilities & Features (Snapshots) ---
    features: string[]; // snapshot of the simple-array

    facilities: {
        livingRooms?: number;
        parking?: number;
        elevators?: number;
        bathrooms?: number;
        securityEntrances?: number;
        bedrooms?: number;
        maidRoom?: boolean;
        kitchen?: number;
        store?: number;
        backyard?: boolean;
        centralAC?: boolean;
        desertAC?: boolean;
        majlis?: number;
        rooms?: number;
    };

    // Ownership Document Details (Snapshot)
    ownershipDocument: {
        type: string;
        number: string;
        date: Date;
        issuedBy: string;
        ownerIdNumber: string;
        documentImage: { path: string; filename: string; } | null;
    };
    // Note: Description and Marketing Images are EXCLUDED as requested
}

export interface PaymentInstallment {
    dueDate: Date;
    amount: number;
    isPaid: boolean;
    paymentDate?: Date;
}

export enum ContractStatus {
    DRAFT = 'draft',
    PENDING_TENANT_ACCEPTANCE = 'pending_tenant_acceptance',
    PENDING_LANDLORD_ACCEPTANCE = 'pending_landlord_acceptance',
    PENDING_SIGNATURE = 'pending_signature',
    ACTIVE = 'active',
    EXPIRED = 'expired',
    CANCELLED = 'cancelled',
    TERMINATED = 'terminated',
    PENDING_TERMINATION = "pending_termination"
}
@Entity('contracts')
export class Contract extends CoreEntity {

    // --------------------------------------------------------
    // 1. Relations (Live Links)
    // --------------------------------------------------------
    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'landlord_id' })
    landlord: User;

    @Column({ type: 'uuid', name: 'landlord_id' })
    landlordId: string;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'tenant_id' })
    tenant: User;

    @Column({ type: 'uuid', name: 'tenant_id' })
    tenantId: string;

    @ManyToOne(() => Property, { nullable: false })
    @JoinColumn({ name: 'property_id' })
    property: Property;

    @Column({ type: 'uuid', name: 'property_id' })
    propertyId: string;

    // --------------------------------------------------------
    // 2. Data Snapshots (Historical Record)
    // --------------------------------------------------------

    @Column({ type: 'jsonb', name: 'landlord_snapshot' })
    landlordSnapshot: UserSnapshot;

    @Column({ type: 'jsonb', name: 'tenant_snapshot' })
    tenantSnapshot: UserSnapshot;

    @Column({
        type: 'jsonb',
        name: 'property_snapshot',
        comment: 'Contains critical property info and ownership doc path, excludes marketing images/desc'
    })
    propertySnapshot: PropertySnapshot;

    // --------------------------------------------------------
    // 3. Financial & Terms
    // --------------------------------------------------------

    @Column({ type: 'varchar', name: 'contract_number', nullable: true, unique: true })
    contractNumber: string | null;

    @Column({ type: 'timestamptz', name: 'start_date' })
    startDate: Date;

    @Column({ type: 'timestamptz', name: 'end_date' })
    endDate: Date;

    @Column({ type: 'timestamptz', name: 'contract_date', nullable: true })
    contractDate: Date | null; // Date of signing

    @Column('decimal', { precision: 12, scale: 2, name: 'total_contract_amount' })
    totalAmount: number; // Total rent for the full duration

    @Column('decimal', { precision: 10, scale: 2, name: 'security_deposit', default: 0 })
    securityDeposit: number;

    @Column({ type: 'enum', enum: RentType, name: 'rent_type' })
    rentType: RentType;

    @Column('decimal', { precision: 5, scale: 2, name: 'platform_fee_percentage', default: 0 })
    platformFeePercentage: number; // e.g., 2.50 for 2.5%

    @Column('decimal', { precision: 10, scale: 2, name: 'platform_fee_amount', default: 0 })
    platformFeeAmount: number; // The calculated fee value

    // --------------------------------------------------------
    // 4. Installments & Conditions
    // --------------------------------------------------------

    @Column({
        type: 'jsonb',
        name: 'payment_schedule',
        comment: 'Array of due dates and amounts'
    })
    paymentSchedule: PaymentInstallment[];

    // 1. The Baseline: Copied from Settings (Read-only for Tenant)
    @Column({ type: 'text', name: 'original_terms' })
    originalTerms: string;

    // 2. The Editable Version: Tenant modifies this
    @Column({ type: 'text', name: 'current_terms' })
    currentTerms: string;

    @Column({ type: 'varchar', name: 'ejar_pdf_path', nullable: true })
    ejarPdfPath: string | null;

    @Column({ type: 'timestamptz', nullable: true })
    terminationInitiatedAt: Date | null; // The moment they clicked terminate

    @Column({ type: 'timestamptz', nullable: true })
    terminationEffectiveDate: Date | null; // For landlords, this is +60 days. For tenants, it's immediate.

    @Column({ type: 'boolean', default: false })
    shouldSendRenewalNotify: boolean;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    renewalDiscountAmount: number;

    @Column({ type: 'int', nullable: true })
    requiredMonthsForIncentive: number | null; // المدة بالأشهر (مثلاً 3 أو 12)

    @Column({ type: 'int' })
    durationInMonths: number;

    @Column({
        type: 'enum',
        enum: ContractStatus,
        default: ContractStatus.DRAFT
    })
    status: ContractStatus;



}