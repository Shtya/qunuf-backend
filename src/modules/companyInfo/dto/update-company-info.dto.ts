import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateCompanyInfoDto {
    @IsString()
    @MaxLength(255)
    @IsNotEmpty()
    title_ar: string;

    @IsString()
    @MaxLength(255)
    @IsNotEmpty()
    title_en: string;

    @IsString()
    @IsNotEmpty()
    content_en: string;

    @IsString()
    @IsNotEmpty()
    content_ar: string;
}
