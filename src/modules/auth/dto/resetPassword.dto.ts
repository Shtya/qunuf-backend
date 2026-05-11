import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
    @ApiProperty({ example: 'user@example.com', description: 'User email address' })
    @IsEmail({}, { message: 'Email must be a valid email address' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;

    @ApiProperty({ example: '123456', description: 'Verification code sent via email' })
    @IsString()
    @IsNotEmpty({ message: 'Verification code is required' })
    code: string;

    @ApiProperty({
        example: 'Password123!',
        description: 'New password (8-20 chars, must contain uppercase, lowercase, number, special char)',
        minLength: 8,
        maxLength: 20,
    })
    @IsString()
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @MaxLength(20, { message: 'Password must not exceed 20 characters' })
    @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$#!%*?&])/, {
        message:
            'Password must contain uppercase, lowercase, number, and special character',
    })
    password: string;
}
