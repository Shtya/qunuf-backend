import {
    IsBoolean,
    IsDateString,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkOrderStatus } from 'src/common/entities/work-order.entity';
import { MaintenancePriority } from 'src/common/entities/maintenance-item.entity';
import { ServiceCategory } from 'src/common/entities/service-provider.entity';
import { RecurrenceType } from 'src/common/entities/maintenance-schedule.entity';

export class CreateWorkOrderDto {
    @ApiProperty()
    @IsUUID()
    propertyId: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ enum: MaintenancePriority })
    @IsEnum(MaintenancePriority)
    priority: MaintenancePriority;

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
    @IsUUID()
    @IsOptional()
    scheduleId?: string;

    @ApiPropertyOptional()
    @IsUUID()
    @IsOptional()
    assignedTenantId?: string;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    isRecurring?: boolean;

    @ApiPropertyOptional({ enum: RecurrenceType })
    @IsEnum(RecurrenceType)
    @IsOptional()
    recurrenceType?: RecurrenceType;

    @ApiPropertyOptional()
    @IsInt()
    @Min(1)
    @IsOptional()
    recurrenceInterval?: number;

    @ApiPropertyOptional()
    @IsDateString()
    @IsOptional()
    recurrenceEndDate?: string;
}
