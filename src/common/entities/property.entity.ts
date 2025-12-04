import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CoreEntity } from './coreEntity';
import { User } from './user.entity';
import { PropertySubtype } from './property-subtype.entity';
import { PropertyType } from './property-type.entity';
import { State } from './state.entity';


export enum RentType {
    MONTHLY = 'monthly',
    YEARLY = 'yearly',
}

export enum PropertyStatus {
    PENDING = 'pending',
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

export enum FurnishedType {
    FURNISHED = 'furnished',
    UNFURNISHED = 'Unfurnished',
}

@Entity('properties')
export class Property extends CoreEntity {
    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ name: 'landlord_id', })
    landlordId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'landlord_id' })
    landlord: User;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'text', name: 'additionalDetails' })
    additionalDetails: string;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    price: number;

    @Column({
        type: 'enum',
        enum: RentType,
        default: RentType.MONTHLY,
        name: 'rent_type',
    })
    rentType: RentType;

    @Column({ type: 'int' })
    bedrooms: number;

    @Column({ type: 'int' })
    bathrooms: number;

    @Column({ type: 'int' })
    kitchen: number;

    @Column({ type: 'int' })
    parking: number;

    @Column({ type: 'int', name: 'year_built' })
    yearBuilt: number;

    @Column({ type: 'int', name: 'square_feet' })
    squareFeet: number;

    @Column({ type: 'int' })
    garages: number;

    @Column({ type: 'int', name: 'max_guests', nullable: true })
    maxGuests: number | null;

    @Column({
        type: 'enum',
        enum: PropertyStatus,
        default: PropertyStatus.PENDING,
        name: 'status',
    })
    status: PropertyStatus;

    @Column({ type: 'boolean', default: false })
    rented: boolean;

    @Column({
        type: 'enum',
        enum: FurnishedType,
        name: 'furnished_type',
    })
    furnishedType: FurnishedType;

    @Column({ name: 'property_type_id', })
    propertyTypeId: string;

    @ManyToOne(() => PropertyType)
    @JoinColumn({ name: 'property_type_id' })
    propertyType: PropertyType;

    @Column({ name: 'property_subtype_id', })
    propertySubtypeId: string;

    @ManyToOne(() => PropertySubtype)
    @JoinColumn({ name: 'property_subtype_id' })
    propertySubtype: PropertySubtype;

    @Column({ type: 'jsonb' })
    images: { url: string; is_primary: boolean }[];

    @Column({ type: 'jsonb' })
    features: string[];

    @Column({ name: 'state_id', })
    stateId: string;

    @ManyToOne(() => State)
    @JoinColumn({ name: 'state_id' })
    state: State;

    @Column({ type: 'varchar', length: 255, nullable: true })
    address: string | null;

    @Column({ type: 'decimal', precision: 10, scale: 8 })
    latitude: number;

    @Column({ type: 'decimal', precision: 11, scale: 8 })
    longitude: number;

    @Column({ type: 'jsonb', nullable: true, name: 'education_institutions' })
    educationInstitutions: {
        name: string;
        type: string;
        distance_km: number;
    }[] | null;

    @Column({ type: 'jsonb', nullable: true, name: 'health_medical_facilities' })
    healthMedicalFacilities: {
        name: string;
        type: string;
        distance_km: number;
    }[] | null;
}
