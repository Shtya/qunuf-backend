import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBlogDto {
    @ApiProperty({ maxLength: 255, example: 'My First Blog' })
    @IsString()
    @MaxLength(255)
    @IsNotEmpty()
    title_ar: string;

    @IsNotEmpty()
    @Transform(({ value }) => {
        // If it's a string (from FormData), parse it. If already an object, return it.
        return typeof value === 'string' ? JSON.parse(value) : value;
    })
    @IsObject() // Now this will pass because the string became an object
    description_ar: any;

    @ApiProperty({ maxLength: 255, example: 'My First Blog' })
    @IsString()
    @MaxLength(255)
    @IsNotEmpty()
    title_en: string;

    @IsNotEmpty()
    @Transform(({ value }) => {
        return typeof value === 'string' ? JSON.parse(value) : value;
    })
    @IsObject()
    description_en: any;

    @ApiProperty({ type: 'string', format: 'binary' })
    @IsOptional()
    image: any;
}

export class SubscribeDto {
    @IsEmail()
    email: string;
}