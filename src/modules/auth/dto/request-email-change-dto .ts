import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class RequestEmailChangeDto {
    @ApiProperty({
        example: 'new@email.com',
        description: 'New email address to change to',
    })
    @IsEmail({}, { message: 'Email must be valid' })
    @IsNotEmpty({ message: 'Email is required' })
    newEmail: string;
}
