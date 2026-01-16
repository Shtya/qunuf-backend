import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBlogDto {
    @ApiProperty({ maxLength: 255, example: 'My First Blog' })
    @IsString()
    @MaxLength(255)
    @IsNotEmpty()
    title_ar: string;

    @ApiProperty({ description: 'The content of the blog' })
    @IsString()
    @IsNotEmpty()
    description_ar: string;

    @ApiProperty({ maxLength: 255, example: 'My First Blog' })
    @IsString()
    @MaxLength(255)
    @IsNotEmpty()
    title_en: string;

    @ApiProperty({ description: 'The content of the blog' })
    @IsString()
    @IsNotEmpty()
    description_en: string;

    @ApiProperty({ type: 'string', format: 'binary' })
    @IsOptional()
    image: any;
}

export class SubscribeDto {
    @IsEmail()
    email: string;
}