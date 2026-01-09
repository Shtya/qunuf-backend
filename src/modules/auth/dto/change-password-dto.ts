import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ChangePasswordDto {
    @ApiProperty({
        example: 'OldPassword123!',
        description: 'Current account password',
    })
    @IsString()
    @IsNotEmpty({ message: 'Current password is required' })
    currentPassword: string;

    @ApiProperty({
        example: 'NewPassword123!',
        description:
            'New password (8-20 chars, must contain uppercase, lowercase, number, special char)',
    })
    @IsString()
    @IsNotEmpty({ message: 'New password is required' })
    @MinLength(8)
    @MaxLength(20)
    @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$#!%*?&])/, {
        message:
            'Password must contain uppercase, lowercase, number, and special character',
    })
    newPassword: string;
}
