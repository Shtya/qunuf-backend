import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'The UUID of the user you want to chat with'
    })
    @IsUUID()
    @IsNotEmpty()
    otherUserId: string;
}