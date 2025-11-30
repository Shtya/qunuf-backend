import { Type } from 'class-transformer';
import { IsString, IsEmail, MinLength, MaxLength, Matches, IsNotEmpty, ValidateNested, Max } from 'class-validator';



export class registerDto {
    @IsString()
    @IsNotEmpty({ message: 'Name is required' })
    @MaxLength(50, { message: 'Name must be at most 50 characters long' })
    name: string;

    @IsEmail({}, { message: 'Email must be a valid email address' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @MaxLength(20, { message: 'Password must not exceed 20 characters' })
    @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])/, {
        message:
            'Password must contain uppercase, lowercase, number, and special character',
    })
    password: string;
}
