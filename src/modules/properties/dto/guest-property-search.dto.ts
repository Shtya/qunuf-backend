import { IsOptional, IsString, IsEnum, IsNumber, Min, IsArray, IsDateString, IsBoolean, ValidateIf, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CommercialSubType, PropertyType, RentType, ResidentialSubType } from 'src/common/entities/property.entity';
export class GuestPropertySearchDto extends PaginationDto {

    @IsOptional()
    @IsIn(['created_at', 'rentPrice', 'area'])
    declare sortBy?: 'created_at' | 'rentPrice' | 'area';

    @IsOptional() @IsString() stateId?: string;

    @IsOptional() @IsEnum(RentType) rentType?: RentType;

    @IsOptional() @IsEnum(PropertyType) propertyType?: PropertyType;


    @ValidateIf(o => o.propertyType === PropertyType.RESIDENTIAL)
    @IsEnum(ResidentialSubType, { message: 'Must be a valid residential sub-type' })
    @ValidateIf(o => o.propertyType === PropertyType.COMMERCIAL)
    @IsEnum(CommercialSubType, { message: 'Must be a valid commercial sub-type' })
    subType: ResidentialSubType | CommercialSubType;

    @IsOptional() @IsBoolean() @Transform(({ value }) => value === 'true' || value === '1') isFurnished?: boolean;

    // Ranges
    @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minPrice?: number;
    @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxPrice?: number;
    @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minArea?: number;
    @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxArea?: number;

    @IsOptional() @IsDateString() constructionDate?: string;

    // Facilities (Passed as query params like: ?bedrooms=3&bathrooms=2)
    @IsOptional() @Type(() => Number) @IsNumber() @Min(0) bedrooms?: number;
    @IsOptional() @Type(() => Number) @IsNumber() @Min(0) bathrooms?: number;
    @IsOptional() @Type(() => Number) @IsNumber() @Min(0) livingRooms?: number;
    @IsOptional() @IsBoolean() @Transform(({ value }) => value === 'true' || value === '1') maidRoom?: boolean;

}