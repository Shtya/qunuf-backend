import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class UpdateTeamDto {
    @ApiProperty({ maxLength: 255 })
    @IsString()
    @MaxLength(255)
    name?: string;

    @ApiProperty({ maxLength: 255 })
    @IsString()
    @MaxLength(255)
    job?: string;

    @ApiProperty({ required: true })
    @IsString()
    description_ar: string;

    @ApiProperty({ required: true })
    @IsString()
    description_en: string;
}
