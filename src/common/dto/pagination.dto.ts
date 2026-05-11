import { IsOptional, IsInt, Min, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @ApiPropertyOptional({ default: 1 })
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @ApiPropertyOptional({ default: 10 })
    limit?: number = 10;

    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ default: 'created_at' })
    sortBy?: string = 'created_at';

    @IsOptional()
    @IsIn(['ASC', 'DESC', 'asc', 'desc'])
    @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
    sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc' = 'DESC';
}