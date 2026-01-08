import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, MaxLength } from 'class-validator';

export class UpdateSettingsDto {
    @ApiProperty({ description: 'Privacy policy (English)', required: false })
    @IsOptional()
    @IsString()
    privacyPolicy_en?: string;

    @ApiProperty({ description: 'Terms of service (English)', required: false })
    @IsOptional()
    @IsString()
    termsOfService_en?: string;

    @ApiProperty({ description: 'Privacy policy (Arabic)', required: false })
    @IsOptional()
    @IsString()
    privacyPolicy_ar?: string;

    @ApiProperty({ description: 'Terms of service (Arabic)', required: false })
    @IsOptional()
    @IsString()
    termsOfService_ar?: string;

    @ApiProperty({ description: 'Address', required: false })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiProperty({ description: 'Latitude', example: 24.7136, required: false })
    @IsOptional()
    @IsNumber()
    latitude?: number;

    @ApiProperty({ description: 'Longitude', example: 46.6753, required: false })
    @IsOptional()
    @IsNumber()
    longitude?: number;

    @ApiProperty({ description: 'Contact email', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    contactEmail?: string;

    @ApiProperty({ description: 'Contact phone', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    contactPhone?: string;

    @ApiProperty({ description: 'Description (Arabic)', required: false })
    @IsOptional()
    @IsString()
    description_ar?: string;

    @ApiProperty({ description: 'Description (English)', required: false })
    @IsOptional()
    @IsString()
    description_en?: string;

    @ApiProperty({ description: 'Facebook link', required: false })
    @IsOptional()
    @IsString()
    facebook?: string;

    @ApiProperty({ description: 'Twitter link', required: false })
    @IsOptional()
    @IsString()
    twitter?: string;

    @ApiProperty({ description: 'Instagram link', required: false })
    @IsOptional()
    @IsString()
    instagram?: string;

    @ApiProperty({ description: 'LinkedIn link', required: false })
    @IsOptional()
    @IsString()
    linkedin?: string;

    @ApiProperty({ description: 'Pinterest link', required: false })
    @IsOptional()
    @IsString()
    pinterest?: string;

    @ApiProperty({ description: 'TikTok link', required: false })
    @IsOptional()
    @IsString()
    tiktok?: string;

    @ApiProperty({ description: 'YouTube link', required: false })
    @IsOptional()
    @IsString()
    youtube?: string;

    @ApiProperty({ description: 'Fax number', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    fax?: string;

    @ApiProperty({ description: 'Platform commission percent', example: 5.0, required: false })
    @IsOptional()
    @IsNumber()
    platformPercent?: number;
}
