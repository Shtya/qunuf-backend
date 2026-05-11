import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

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
    @IsNotEmpty()
    description_ar: string;

    @ApiProperty({ required: true })
    @IsString()
    @IsNotEmpty()
    description_en: string;

    @ApiProperty({ maxLength: 50 })
    @IsString()
    @MaxLength(50)
    @IsNotEmpty()
    phone: string;

    @ApiProperty({ maxLength: 255 })
    @IsEmail()
    @MaxLength(255)
    @IsNotEmpty()
    email: string;

    @ApiProperty({ type: 'string', format: 'binary', required: false })
    @IsOptional()
    image?: any;
}
