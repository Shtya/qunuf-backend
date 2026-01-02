import { IsString, IsNotEmpty, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'The ID of the conversation this message belongs to'
    })
    @IsUUID('4', { message: 'Invalid conversation ID format' })
    @IsNotEmpty()
    conversationId: string;

    @ApiProperty({
        example: 'Hello, is the property still available?',
        description: 'The text content of the message'
    })
    @IsString()
    @IsNotEmpty({ message: 'Message content cannot be empty' })
    @MinLength(1, { message: 'Message must contain at least 1 character' })
    @MaxLength(3000, { message: 'Message is too long (max 3000 characters)' })
    content: string;
}