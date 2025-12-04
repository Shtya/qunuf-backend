import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTeamDto {
    @ApiProperty({ maxLength: 255 })
    @IsString()
    @MaxLength(255)
    @IsNotEmpty()
    name: string;

    @ApiProperty({ maxLength: 255 })
    @IsString()
    @MaxLength(255)
    @IsNotEmpty()
    job: string;

    @ApiProperty({ required: true })
    @IsString()
    description_ar: string;

    @ApiProperty({ required: true })
    @IsString()
    description_en: string;
}
