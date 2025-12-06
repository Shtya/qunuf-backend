import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateContactUsDto {
    @ApiProperty()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsEmail()
    @MaxLength(255)
    email: string;

    @ApiProperty()
    @IsNotEmpty()
    @MaxLength(50)
    phone: string;

    @ApiProperty()
    @IsNotEmpty()
    message: string;
}
