import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateContactUsDto {
    @ApiProperty({
        description: 'Full name of the user submitting the contact form',
        maxLength: 255,
    })
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @ApiProperty({
        description: 'Email address of the user',
        maxLength: 255,
    })
    @IsNotEmpty()
    @IsEmail()
    @MaxLength(255)
    email: string;

    @ApiProperty({
        description: 'Phone number of the user',
        maxLength: 50,
    })
    @IsNotEmpty()
    @MaxLength(50)
    phone: string;

    @ApiProperty({
        description: 'Message content submitted by the user',
    })
    @IsNotEmpty()
    message: string;
}
