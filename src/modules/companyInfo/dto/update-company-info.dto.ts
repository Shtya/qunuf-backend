import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { CompanySection } from 'src/common/entities/companyInfo.entity';

export class UpdateCompanyInfoDto {
    @IsString()
    @MaxLength(255)
    @IsOptional()
    title_ar?: string;

    @IsString()
    @MaxLength(255)
    @IsOptional()
    title_en?: string;

    @IsString()
    @IsOptional()
    content_en?: string;

    @IsString()
    @IsOptional()
    content_ar?: string;
}
