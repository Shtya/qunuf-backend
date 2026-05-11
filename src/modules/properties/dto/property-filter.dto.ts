import { IsOptional, IsString, IsEnum, IsNumber, Min, IsIn, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { BuildingType, PaymentCycle, PropertyPurpose, PropertyStatus, PropertyType } from 'src/common/entities/property.entity';
import { OmitType } from '@nestjs/swagger';


export class PropertyFilterDto extends PaginationDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    status?: PropertyStatus | 'all' = 'all';

    @IsOptional()
    propertyType?: PropertyType | 'all' = 'all';

    @IsOptional()
    @IsEnum(BuildingType)
    buildingType?: BuildingType;

    @IsOptional()
    @IsEnum(PropertyPurpose)
    propertyPurpose?: PropertyPurpose;

    @IsOptional()
    @IsEnum(PaymentCycle)
    paymentCycle?: PaymentCycle;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === '1')
    isRented?: boolean;

    @IsOptional()
    @IsIn(['created_at', 'name', 'status', 'isRented', 'propertyType', 'rentPrice', 'buildingType', 'propertyPurpose'])
    declare sortBy?: 'created_at' | 'name' | 'status' | 'isRented' | 'propertyType' | 'rentPrice' | 'buildingType' | 'propertyPurpose';

}


export class PropertyExportFilterDto extends OmitType(PropertyFilterDto, ['page'] as const) { }




