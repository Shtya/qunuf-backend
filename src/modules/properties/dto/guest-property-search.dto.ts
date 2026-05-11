import { IsOptional, IsString, IsEnum, IsNumber, Min, IsArray, IsDateString, IsBoolean, ValidateIf, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CommercialSubType, PropertyType, RentType, ResidentialSubType } from 'src/common/entities/property.entity';

export class GuestPropertySearchDto extends PaginationDto {

    @IsOptional() @IsString() stateId?: string;

    @IsOptional() @IsEnum(RentType) rentType?: RentType;

    @IsOptional() @IsEnum(PropertyType) propertyType?: PropertyType;

    // 1. Updated DTO Logic
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @Transform(({ value }) => {
        if (value === 'undefined' || value === null || value === '') return undefined;
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') return value.split(',').filter(Boolean);

        return value;
    })
    subTypes?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @Transform(({ value }) => {
        if (value === 'undefined' || value === null || value === '') return undefined;
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') return value.split(',').filter(Boolean);
        return value;
    })
    features?: string[];

    @IsOptional()
    @Transform(({ value }) => (value === 'furnished' ? true : value === 'unfurnished' ? false : undefined))
    isFurnished?: boolean;

    // Bathroom/Bedroom logic
    @IsOptional() @IsString() bathroom?: string; // '1_0', '2_5', 'threeAndMore'
    @IsOptional() @IsString() bedroom?: string;  // '1', 'fiveAndMore'


    // Ranges
    @IsOptional() @Type(() => Number) @IsNumber() minPrice?: number;
    @IsOptional() @Type(() => Number) @IsNumber() maxPrice?: number;
    @IsOptional() @Type(() => Number) @IsNumber() minArea?: number;
    @IsOptional() @Type(() => Number) @IsNumber() maxArea?: number;
    @IsOptional() @Type(() => Number) @IsNumber() minYear?: number;
    @IsOptional() @Type(() => Number) @IsNumber() maxYear?: number;

    @IsOptional()
    @IsIn(['created_at', 'rent_price', 'area']) // Ensure snake_case for TypeORM orderBy
    declare sortBy?: 'created_at' | 'rent_price' | 'area';
}