import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { CompanySection } from 'src/common/entities/companyInfo.entity';


export class SectionParamDto {
    @IsEnum(CompanySection)
    section: string;
}
;

export class CreateCompanyInfoDto {
    @ApiProperty({
        enum: CompanySection,
        description: 'Section of the company info'
    })
    @IsEnum(CompanySection)
    @IsNotEmpty()
    section: CompanySection;

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
}