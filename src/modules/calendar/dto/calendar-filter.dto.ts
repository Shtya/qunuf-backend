import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CalendarFilterDto {
    @ApiPropertyOptional({ example: '2025-06-01T00:00:00Z', description: 'Range start (ISO)' })
    @IsOptional()
    @IsDateString()
    start?: string;

    @ApiPropertyOptional({ example: '2025-06-30T23:59:59Z', description: 'Range end (ISO)' })
    @IsOptional()
    @IsDateString()
    end?: string;

    @ApiPropertyOptional({
        example: 'contract_start,payment_due,custom',
        description: 'Comma-separated list of event types to include',
    })
    @IsOptional()
    @IsString()
    types?: string;
}
