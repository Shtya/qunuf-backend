import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceCategory } from 'src/common/entities/service-provider.entity';
import { MaintenancePriority } from 'src/common/entities/maintenance-item.entity';

export class CreateMaintenanceItemDto {
    @ApiProperty()
    @IsUUID()
    propertyId: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    location?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    unitNumber?: string;

    @ApiProperty({ enum: MaintenancePriority })
    @IsEnum(MaintenancePriority)
    priority: MaintenancePriority;

    @ApiProperty({ enum: ServiceCategory })
    @IsEnum(ServiceCategory)
    category: ServiceCategory;
}
