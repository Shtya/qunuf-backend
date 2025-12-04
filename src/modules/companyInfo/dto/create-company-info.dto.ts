import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { CompanySection } from 'src/common/entities/companyInfo.entity';


export class SectionParamDto {
    @IsEnum(CompanySection)
    section: string;
}

export class CreateCompanyInfoDto {

    @IsEnum(CompanySection)
    @IsNotEmpty()
    sectionKey: string;

    @IsString()
    @MaxLength(255)
    @IsNotEmpty()
    title_ar: string;

    @IsString()
    @MaxLength(255)
    @IsNotEmpty()
    title_en: string;

    @IsOptional()
    @IsString()
    content_en?: string;

    @IsOptional()
    @IsString()
    content_ar?: string;
}
