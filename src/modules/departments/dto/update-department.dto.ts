import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDepartmentDto {
    @ApiProperty({ maxLength: 255, description: 'Title in Arabic' })
    @IsString()
    @MaxLength(255)
    title_ar: string;

    @ApiProperty({ maxLength: 255, description: 'Title in English' })
    @IsString()
    @MaxLength(255)
    title_en: string;

    @ApiProperty({ description: 'Description in Arabic' })
    @IsString()
    description_ar: string;

    @ApiProperty({ description: 'Description in English' })
    @IsString()
    description_en: string;
}
