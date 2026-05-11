import {
    IsString, IsEnum, IsNumber, IsOptional, IsArray,
    IsNotEmpty, ValidateNested, ArrayMaxSize, ArrayMinSize,
    Min, Max, MaxLength, MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PropertyType, RentType, OwnershipType } from 'src/common/entities/property.entity';

export class BulkPropertyItemDto {
    @IsString() @MinLength(3) @MaxLength(100) @IsNotEmpty()
    name: string;

    @IsEnum(PropertyType)
    propertyType: PropertyType;

    @IsString() @IsNotEmpty()
    subType: string;

    @IsEnum(RentType)
    rentType: RentType;

    @IsNumber() @Type(() => Number) @Min(1) @Max(1000000)
    rentPrice: number;

    @IsNumber() @Type(() => Number) @Min(1) @Max(100000)
    area: number;

    @IsString() @IsNotEmpty()
    stateId: string;

    @IsOptional() @IsString() @MaxLength(2000)
    description?: string;

    @IsOptional() @IsEnum(OwnershipType)
    ownershipType?: OwnershipType;

    @IsOptional() @IsNumber() @Type(() => Number) @Min(0)
    securityDeposit?: number;

    @IsOptional() @IsNumber() @Type(() => Number) @Min(0)
    capacity?: number;

    @IsOptional() @IsString() @MaxLength(20)
    propertyNumber?: string;

    @IsOptional() @IsString() @MaxLength(8)
    nationalAddressCode?: string;
}

export class BulkCreatePropertyDto {
    @IsArray()
    @ArrayMinSize(1, { message: 'At least one property is required' })
    @ArrayMaxSize(50, { message: 'Cannot bulk add more than 50 properties at once' })
    @ValidateNested({ each: true })
    @Type(() => BulkPropertyItemDto)
    properties: BulkPropertyItemDto[];
}
