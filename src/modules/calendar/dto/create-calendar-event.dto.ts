import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsDateString,
    IsEnum,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';
import { CalendarEventType } from 'src/common/entities/calendar_event.entity';

export class CreateCalendarEventDto {
    @ApiProperty({ example: 'Team meeting' })
    @IsString()
    @MaxLength(255)
    title: string;

    @ApiPropertyOptional({ example: 'Monthly sync with landlord' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ example: '2025-06-15T09:00:00Z' })
    @IsDateString()
    startDate: string;

    @ApiPropertyOptional({ example: '2025-06-15T10:00:00Z' })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({ example: false })
    @IsOptional()
    @IsBoolean()
    allDay?: boolean;

    @ApiPropertyOptional({ example: '#4F46E5' })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    color?: string;

    @ApiPropertyOptional({ enum: CalendarEventType })
    @IsOptional()
    @IsEnum(CalendarEventType)
    eventType?: CalendarEventType;

    @ApiPropertyOptional({ example: 'https://example.com' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    url?: string;
}
