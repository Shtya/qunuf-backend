import { IsOptional, IsString, IsEnum, IsNumber, Min, IsIn, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PropertyStatus, PropertyType } from 'src/common/entities/property.entity';


export class PropertyFilterDto extends PaginationDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsEnum(PropertyStatus)
    status?: PropertyStatus | 'all' = 'all';

    @IsOptional()
    @IsEnum(PropertyType)
    propertyType?: PropertyType;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    isFurnished?: boolean;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    isRented?: boolean;

    @IsOptional()
    @IsIn(['created_at', 'rentPrice', 'area'])
    declare sortBy?: 'created_at' | 'rentPrice' | 'area';

}