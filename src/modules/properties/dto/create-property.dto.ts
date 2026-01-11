// src/properties/dto/create-property.dto.ts
import {
    IsString, IsEnum, IsNumber, IsBoolean, IsOptional, IsArray,
    MinLength, MaxLength, ArrayMaxSize, ValidateNested, IsUUID, Min,
    Matches,
    ValidateIf,
    IsNotEmpty,
    Length,
    Max,
    IsDateString
} from 'class-validator';
import { Type } from 'class-transformer';
import { CommercialSubType, DocumentType, OwnershipType, PropertyType, RentType, ResidentialSubType } from 'src/common/entities/property.entity';


class FacilityDto {
    @IsString() @MaxLength(100) name: string;
    @IsString() @MaxLength(100) type: string;
    @IsNumber() @Min(0) @Max(50) distance_km: number;
}
class PropertyFacilitiesDto {
    @IsOptional() @IsNumber() @Min(0) livingRooms?: number;
    @IsOptional() @IsNumber() @Min(0) parking?: number;
    @IsOptional() @IsNumber() @Min(0) elevators?: number;
    @IsOptional() @IsNumber() @Min(0) bathrooms?: number;
    @IsOptional() @IsNumber() @Min(0) securityEntrances?: number;
    @IsOptional() @IsNumber() @Min(0) bedrooms?: number;
    @IsOptional() @IsBoolean() @Type(() => Boolean) maidRoom?: boolean;
    @IsOptional() @IsNumber() @Min(0) kitchen?: number;
    @IsOptional() @IsNumber() @Min(0) store?: number;
    @IsOptional() @IsBoolean() @Type(() => Boolean) backyard?: boolean;
    @IsOptional() @IsBoolean() @Type(() => Boolean) centralAC?: boolean;
    @IsOptional() @IsBoolean() @Type(() => Boolean) desertAC?: boolean;
    @IsOptional() @IsNumber() @Min(0) majlis?: number;
    @IsOptional() @IsNumber() @Min(0) rooms?: number;
}

export class CreatePropertyDto {
    @IsString() @MinLength(3) @IsNotEmpty() @MaxLength(100) name: string;

    @IsString() @MinLength(20) @IsNotEmpty() @MaxLength(2000) description: string;

    @IsOptional() @IsString() @IsNotEmpty() @MaxLength(1500) additionalDetails?: string;

    @IsEnum(PropertyType, { message: 'Invalid property type' })
    propertyType: PropertyType;

    @ValidateIf(o => o.propertyType === PropertyType.RESIDENTIAL)
    @IsEnum(ResidentialSubType, { message: 'Must be a valid residential sub-type' })
    @ValidateIf(o => o.propertyType === PropertyType.COMMERCIAL)
    @IsEnum(CommercialSubType, { message: 'Must be a valid commercial sub-type' })
    subType: ResidentialSubType | CommercialSubType;

    @IsOptional() @IsNumber() @IsNotEmpty() @Min(1) capacity?: number;
    @IsBoolean() @Type(() => Boolean) isFurnished: boolean;
    @IsString()
    @IsNotEmpty()
    @MinLength(1)
    @MaxLength(20) // Typical max for building/unit numbers including sub-units
    @Matches(/^[a-zA-Z0-9\-\/]+$/, {
        message: 'Property number can only contain letters, numbers, dashes, and slashes'
    }) propertyNumber: string;

    @IsNumber() @IsNotEmpty() @Min(1) area: number;
    @IsNumber() @IsNotEmpty() @Min(1) rentPrice: number;
    @IsNumber() @IsNotEmpty() @Min(0) securityDeposit: number;

    @IsOptional() @IsDateString() constructionDate?: string;
    @IsNotEmpty() @IsDateString() documentIssueDate: string;

    @IsOptional() @IsString() @MaxLength(100) insurancePolicyNumber?: string;
    @IsOptional() @IsString() @MaxLength(200) complexName?: string;

    @IsEnum(RentType) @IsNotEmpty() rentType: RentType;
    @IsEnum(OwnershipType) @IsNotEmpty() ownershipType: OwnershipType;

    // Document Data
    @IsEnum(DocumentType) @IsNotEmpty() documentType: DocumentType;
    @IsString() @IsNotEmpty() @MaxLength(25) documentNumber: string;
    @IsString() @IsNotEmpty() @Matches(/^[a-zA-Z0-9]*$/) @MinLength(3) @MaxLength(20) ownerIdNumber: string;
    @IsString() @IsNotEmpty() @MaxLength(3) @MaxLength(250) issuedBy: string;

    @IsString()
    @IsNotEmpty({ message: 'National Address Code is required' })
    @Length(8, 8, { message: 'National Address Code must be exactly 8 characters' })
    @Matches(/^[A-Z]{4}\d{4}$|^[0-9]{8}$/, { message: 'National Address Code must be 8 alphanumeric characters' })
    nationalAddressCode: string;

    @IsOptional() @IsNumber() latitude?: number;
    @IsOptional() @IsNumber() longitude?: number;

    @IsString() @IsNotEmpty() stateId: string;

    @IsOptional() @ValidateNested() @Type(() => PropertyFacilitiesDto)
    facilities?: PropertyFacilitiesDto;

    @IsOptional() @IsArray() @ArrayMaxSize(8)
    @ValidateNested({ each: true }) @Type(() => FacilityDto)
    educationInstitutions?: FacilityDto[];

    @IsOptional() @IsArray() @ArrayMaxSize(8)
    @ValidateNested({ each: true }) @Type(() => FacilityDto)
    healthMedicalFacilities?: FacilityDto[];

    // Meter Numbers
    @IsOptional() @IsString() @MaxLength(50) gasMeterNumber?: string;
    @IsOptional() @IsString() @MaxLength(50) electricityMeterNumber?: string;
    @IsOptional() @IsString() @MaxLength(50) waterMeterNumber?: string;

    @IsOptional()
    @IsArray({ message: 'Features must be an array' })
    @ArrayMaxSize(30, { message: 'Max 30 features allowed' })
    @IsString({ each: true, message: 'Each feature must be a string' })
    @MaxLength(50, {
        each: true,
        message: 'Each feature must not exceed 50 characters'
    })
    features?: string[];

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(5) // Since maxCount for images is 6, the index can be 0 to 5
    @Type(() => Number)
    primaryImageIndex?: number = 0;
}