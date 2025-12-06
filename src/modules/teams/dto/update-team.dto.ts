import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateTeamDto {
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

    @ApiProperty({ description: 'Phone number', maxLength: 50 })
    @IsString()
    @MaxLength(50)
    @IsNotEmpty()
    phone: string;

    @ApiProperty({ description: 'Email address', maxLength: 255 })
    @IsEmail()
    @MaxLength(255)
    @IsNotEmpty()
    email: string;
}
