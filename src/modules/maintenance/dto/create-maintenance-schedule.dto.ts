import {
    IsArray,
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
import { RecurrenceType } from 'src/common/entities/maintenance-schedule.entity';

export class CreateMaintenanceScheduleDto {
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

    @ApiProperty()
    @IsDateString()
    startDate: string;

    @ApiPropertyOptional()
    @IsDateString()
    @IsOptional()
    endDate?: string;

    @ApiProperty({ enum: RecurrenceType })
    @IsEnum(RecurrenceType)
    recurrenceType: RecurrenceType;

    @ApiPropertyOptional()
    @IsInt()
    @Min(1)
    @IsOptional()
    recurrenceInterval?: number;

    @ApiPropertyOptional({ type: [Number] })
    @IsArray()
    @IsInt({ each: true })
    @IsOptional()
    notificationDaysBefore?: number[];

    @ApiPropertyOptional()
    @IsUUID()
    @IsOptional()
    maintenanceItemId?: string;

    @ApiPropertyOptional()
    @IsUUID()
    @IsOptional()
    providerId?: string;
}
