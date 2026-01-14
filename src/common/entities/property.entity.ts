import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CoreEntity } from './coreEntity';
import { User } from './user.entity';
import { State } from './state.entity';
// --- Enums المحدثة بقيم Small Case ---

export enum PropertyType {
    COMMERCIAL = 'commercial',
    RESIDENTIAL = 'residential',
}

export enum ResidentialSubType {
    APARTMENT = 'apartment',
    VILLA = 'villa',
    FLOOR = 'floor',
    ROOM = 'room',
    POPULAR_HOUSE = 'popular_house',
    ANNEX = 'annex',
    LABOR_HOUSING = 'labor_housing',
    INDIVIDUAL_HOUSING = 'individual_housing',
    DRIVER_ROOM = 'driver_room',
    FAMILY_HOUSING = 'family_housing',
    OTHER = 'other',
}

export enum CommercialSubType {
    OFFICE = 'office',
    RETAIL_STORE = 'retail_store',
    SHOWROOM = 'showroom',
    WAREHOUSE = 'warehouse',
    WORKSHOP = 'workshop',
    COMMERCIAL_CENTER = 'commercial_center',
    COMMERCIAL_BUILDING = 'commercial_building',
    COMMERCIAL_LABOR_HOUSING = 'commercial_labor_housing',
    KIOSK = 'kiosk',
    LAND = 'land',
    OTHER = 'other',
}

export enum OwnershipType {
    OWNER = 'owner',
    REPRESENTATIVE = 'representative',
}

// export enum PaymentType {
//     MONTHLY = 'monthly',
//     QUARTERLY = 'quarterly',
//     SEMI_ANNUAL = 'semi_annual',
//     ANNUAL = 'annual',
// }

export enum DocumentType {
    ELECTRONIC_DEED = 'electronic_deed',
    REAL_ESTATE_REGISTRATION = 'real_estate_registration',
    OTHER = 'other',
}

export enum RentType {
    MONTHLY = 'monthly',
    YEARLY = 'yearly',
}

export enum PropertyStatus {
    PENDING = 'pending',     // بانتظار المراجعة (بعد الإضافة من المالك)
    ACTIVE = 'active',       // مفعّل وظاهر للجميع
    INACTIVE = 'inactive',   // معطل (مؤقتاً)
    REJECTED = 'rejected',   // مرفوض من الإدارة
    ARCHIVED = 'archived',   // مؤرشف (محذوف منطقياً)
}
// --- Entity المحدثة بأسماء الأعمدة snake_case ---

@Entity('properties')
export class Property extends CoreEntity {
    @Column({ name: 'name' })
    name: string;

    @Column({ type: 'text', name: 'description' })
    description: string;

    @Column({ type: 'text', nullable: true, name: 'additional_details' })
    additionalDetails: string;

    @Column({
        type: 'enum',
        enum: PropertyStatus,
        default: PropertyStatus.PENDING,
        name: 'status'
    })
    status: PropertyStatus;

    @Column({ type: 'jsonb', nullable: true, name: 'education_institutions' })
    educationInstitutions: {
        name: string;
        distance_km: number;
    }[] | null;

    @Column({ type: 'jsonb', nullable: true, name: 'health_medical_facilities' })
    healthMedicalFacilities: {
        name: string;
        distance_km: number;
    }[] | null;

    @Column({ type: 'jsonb', name: 'images' })
    images: { url: string; is_primary: boolean }[];

    @Column({ type: 'enum', enum: PropertyType, name: 'property_type' })
    propertyType: PropertyType;

    @Column({
        type: 'varchar',
        length: 50,
        name: 'sub_type',
        comment: 'Stores values from ResidentialSubType or CommercialSubType'
    })
    subType: ResidentialSubType | CommercialSubType | string;

    @Column({ type: 'int', nullable: true, name: 'capacity' })
    capacity: number;

    @Column({ default: false, name: 'is_furnished' })
    isFurnished: boolean;

    @Column({ default: false, name: 'is_rented' })
    isRented: boolean;

    @Column({ name: 'property_number' })
    propertyNumber: string;

    @Column('decimal', { precision: 10, scale: 2, name: 'area' })
    area: number;

    @Column('decimal', { precision: 10, scale: 2, name: 'rent_price' })
    rentPrice: number;

    @Column('decimal', { precision: 10, scale: 2, name: 'security_deposit' })
    securityDeposit: number;

    @Column({ type: 'timestamptz', nullable: true, name: 'construction_date' })
    constructionDate: Date;

    @Column({ type: 'enum', enum: RentType, name: 'rent_type' })
    rentType: RentType;

    @Column({ nullable: true, name: 'insurance_policy_number' })
    insurancePolicyNumber: string;

    @Column({ type: 'enum', enum: OwnershipType, name: 'ownership_type' })
    ownershipType: OwnershipType;

    @Column({ nullable: true, name: 'complex_name' })
    complexName: string;

    @Column({ type: 'enum', enum: DocumentType, name: 'document_type' })
    documentType: DocumentType;

    @Column({ type: 'timestamptz', name: 'document_issue_date' })
    documentIssueDate: Date;

    @Column({ name: 'document_number' })
    documentNumber: string;

    @Column({ name: 'owner_id_number' })
    ownerIdNumber: string;

    @Column({ name: 'issued_by' })
    issuedBy: string;

    @Column({ type: 'jsonb', name: 'document_image_path', nullable: true })
    documentImage: { path: string; filename: string } | null;

    @Column({ name: 'national_address_code' })
    nationalAddressCode: string;

    @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true, name: 'latitude' })
    latitude: number;

    @Column({ type: 'decimal', precision: 11, scale: 6, nullable: true, name: 'longitude' })
    longitude: number;

    // Example: "Riyadh"
    @ManyToOne(() => State, { nullable: false, eager: true })
    @JoinColumn({ name: 'state_id' })
    state: State;

    @Column({ type: 'json', nullable: true, name: 'facilities' })
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

    @Column({ nullable: true, name: 'gas_meter_number' })
    gasMeterNumber: string;

    @Column({ nullable: true, name: 'electricity_meter_number' })
    electricityMeterNumber: string;

    @Column({ nullable: true, name: 'water_meter_number' })
    waterMeterNumber: string;

    @Column('simple-array', { nullable: true, name: 'features' })
    features: string[];

    @ManyToOne(() => User, (user) => user.id)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'uuid', name: 'user_id' })
    userId: string;


    @Column({ type: 'uuid', name: 'state_id', nullable: true })
    stateId: string | null;

}
