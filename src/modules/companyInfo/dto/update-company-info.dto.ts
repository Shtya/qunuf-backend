import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';


export class UpdateCompanyInfoDto {
    @ApiProperty({
        maxLength: 255,
        description: 'Arabic title of the company info'
    })
    @IsString()
    @MaxLength(255)
    @IsNotEmpty()
    title_ar: string;

    @ApiProperty({
        maxLength: 255,
        description: 'English title of the company info'
    })
    @IsString()
    @MaxLength(255)
    @IsNotEmpty()
    title_en: string;

    @ApiProperty({
        description: 'English content of the company info'
    })
    @IsString()
    @IsNotEmpty()
    content_en: string;

    @ApiProperty({
        description: 'Arabic content of the company info'
    })
    @IsString()
    @IsNotEmpty()
    content_ar: string;

    @ApiProperty({ type: 'string', format: 'binary', required: false })
    @IsOptional()
    image?: any;
}