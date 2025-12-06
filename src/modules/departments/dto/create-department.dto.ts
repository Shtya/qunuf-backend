import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDepartmentDto {
    @ApiProperty({ maxLength: 255, description: 'Title in Arabic' })
    @IsString()
    @MaxLength(255)
    @IsNotEmpty()
    title_ar: string;

    @ApiProperty({ maxLength: 255, description: 'Title in English' })
    @IsString()
    @MaxLength(255)
    @IsNotEmpty()
    title_en: string;

    @ApiProperty({ description: 'Description in Arabic', required: true })
    @IsNotEmpty()
    @IsString()
    description_ar: string;

    @ApiProperty({ description: 'Description in English', required: true })
    @IsNotEmpty()
    @IsString()
    description_en: string;

    @ApiProperty({ type: 'string', format: 'binary', required: false })
    @IsOptional()
    image?: any;
}
