import { Controller, Post, Body, UseGuards, Get, Query, Put, Param, Patch } from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiNotFoundResponse,
    ApiUnauthorizedResponse,
    ApiBearerAuth,
    ApiBody,
    ApiQuery,
    ApiParam
} from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { User } from 'src/common/decorators/user.decorator';
import { CreateConversationDto } from './dto/create.conversation.dto';
import { decodeCursor, encodeCursor } from 'src/common/utils/crud.util';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { SendMessageDto } from './dto/send.message.dto';
import { ulid } from 'ulid';


@ApiTags('Conversations')
@Controller('conversations')
export class ConversationsController {
    constructor(private readonly conversationsService: ConversationsService) { }
    @Post()
    @ApiOperation({ summary: 'Get or Create a conversation with another user' })
    @ApiResponse({
        status: 201,
        description: 'Conversation retrieved or created successfully.'
    })
    @ApiBody({ type: CreateConversationDto })
    @ApiNotFoundResponse({ description: 'One or both users not found.' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized access.' })
    @UseGuards(JwtAuthGuard)
    async getOrCreate(
        @User() user: any,
        @Body() dto: CreateConversationDto
    ) {
        return this.conversationsService.getOrCreateConversation(user.id, dto.otherUserId);
    }

    @Get()
    @ApiOperation({ summary: 'Get my conversation list (Inbox)' })
    @ApiQuery({ name: 'cursor', required: false, type: String })
    @ApiQuery({ name: 'limit', required: false, example: 50 })
    @UseGuards(JwtAuthGuard)
    async getInbox(
        @User() user: any,
        @Query('cursor') cursor?: string,
        @Query('limit') limit: number = 50
    ) {
        const safeLimit = Math.min(Number(limit) || 10, 50);
        const parsedCursor = decodeCursor(cursor);

        const result = await this.conversationsService.findMyConversations(
            user.id,
            parsedCursor,
            safeLimit
        );

        return {
            ...result,
            nextCursor: encodeCursor(result.nextCursor)
        };
    }

    @Post('message')
    @ApiOperation({ summary: 'Send a message in a conversation' })
    @ApiNotFoundResponse({ description: 'Conversation not found or access denied.' })
    @ApiBody({ type: SendMessageDto })
    @UseGuards(JwtAuthGuard)
    async send(
        @User() user: any,
        @Body() dto: SendMessageDto, // Should contain conversationId and content
    ) {
        return this.conversationsService.sendMessage(user.id, dto.conversationId, dto.content, dto.tempId);
    }


    @Put(':id/read')
    @ApiOperation({ summary: 'Mark all messages in a conversation as read' })
    @ApiParam({ name: 'id', description: 'The Conversation ID' })
    @ApiResponse({ status: 200, description: 'Conversation unread count reset successfully' })
    @UseGuards(JwtAuthGuard)
    async markRead(
        @Param('id') id: string,
        @User() user: any // Assuming your JWT decorator provides the user object
    ) {
        return await this.conversationsService.markAsRead(id, user.id);
    }

    @Get(':id/messages')
    @ApiOperation({ summary: 'Get messages for a conversation with cursor pagination' })
    @ApiQuery({ name: 'cursor', required: false, type: String })
    @ApiQuery({ name: 'limit', required: false, example: 50 })
    @UseGuards(JwtAuthGuard)
    async listMessages(
        @User() user: any,
        @Param('id') conversationId: string,
        @Query('cursor') cursor?: string,
        @Query('limit') limit: number = 20
    ) {
        const safeLimit = Math.min(Number(limit) || 20, 50);
        const parsedCursor = decodeCursor(cursor);

        const result = await this.conversationsService.findAllCursorMessages(
            conversationId,
            user.id,
            parsedCursor,
            safeLimit,
        );

        return {
            ...result,
            nextCursor: encodeCursor(result.nextCursor)
        };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a conversation by ID with its last message' })
    @ApiParam({ name: 'id', description: 'The Conversation ID' })
    @UseGuards(JwtAuthGuard)
    async getConversationById(
        @User() user: any,
        @Param('id') conversationId: string,
    ) {
        return this.conversationsService.getConversationById(conversationId, user.id);
    }

    @Get('unread/count')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get total unread message count across all conversations' })
    @ApiResponse({ status: 200, schema: { example: { totalUnread: 5 } } })
    async getUnreadCount(@User() user: any) {
        return this.conversationsService.getGlobalUnreadCount(user.id);
    }
}
