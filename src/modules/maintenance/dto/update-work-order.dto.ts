import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { WorkOrderStatus } from 'src/common/entities/work-order.entity';
import { MaintenancePriority } from 'src/common/entities/maintenance-item.entity';
import { ServiceCategory } from 'src/common/entities/service-provider.entity';

export class UpdateWorkOrderDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    title?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ enum: MaintenancePriority })
    @IsEnum(MaintenancePriority)
    @IsOptional()
    priority?: MaintenancePriority;

    @ApiPropertyOptional({ enum: ServiceCategory })
    @IsEnum(ServiceCategory)
    @IsOptional()
    category?: ServiceCategory;

    @ApiPropertyOptional()
    @IsDateString()
    @IsOptional()
    dueDate?: string;

    @ApiPropertyOptional()
    @IsUUID()
    @IsOptional()
    providerId?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    notes?: string;
}

export class UpdateWorkOrderStatusDto {
    @ApiPropertyOptional({ enum: WorkOrderStatus })
    @IsEnum(WorkOrderStatus)
    @IsOptional()
    status?: WorkOrderStatus;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiPropertyOptional()
    @IsUUID()
    @IsOptional()
    providerId?: string;
}

export class RateWorkOrderDto {
    @ApiPropertyOptional()
    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    comment?: string;
}
