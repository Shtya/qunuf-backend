import { IsEmail, IsString, IsNotEmpty, MaxLength, MinLength, Matches, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/common/entities/user.entity';

export class registerDto {
    @ApiProperty({ example: 'John Doe', description: 'Full name of the user', maxLength: 50 })
    @IsString()
    @IsNotEmpty({ message: 'Name is required' })
    @MaxLength(50, { message: 'Name must be at most 50 characters long' })
    name: string;

    @ApiProperty({ example: 'user@example.com', description: 'User email address' })
    @IsEmail({}, { message: 'Email must be a valid email address' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;

    @ApiProperty({
        example: 'Password123!',
        description: 'Password (8-20 chars, must contain uppercase, lowercase, number, special char)',
        minLength: 8,
        maxLength: 20,
    })
    @IsString()
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @MaxLength(20, { message: 'Password must not exceed 20 characters' })
    @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@#$!%*?&])/, {
        message:
            'Password must contain uppercase, lowercase, number, and special character',
    })
    password: string;

    @ApiProperty({ example: 'tenant', description: 'Role of the user', enum: UserRole })
    @IsIn(['tenant', 'landlord'], { message: 'Role must be either tenant or landlord' })
    role: UserRole;
}
