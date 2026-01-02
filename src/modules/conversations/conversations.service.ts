import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Conversation } from "src/common/entities/conversation.entity";
import { User, UserRole } from "src/common/entities/user.entity";
import { Repository } from "typeorm";
import { Message } from "src/common/entities/message.entity";
import { CRUD } from "src/common/services/crud.service";
import { AppGateway } from "src/common/websocket/app.gateway";

@Injectable()
export class ConversationsService {
    constructor(
        @InjectRepository(Conversation)
        private readonly conversationRepo: Repository<Conversation>,

        @InjectRepository(Message)
        private readonly messageRepo: Repository<Message>,

        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        private readonly appGateway: AppGateway,

    ) { }

    async getOrCreateConversation(userAId: string, userBId: string) {

        const [p1, p2] = [userAId, userBId].sort();
        const [part1, part2] = await Promise.all([
            this.userRepo.findOne({ where: { id: p1 } }),
            this.userRepo.findOne({ where: { id: p2 } })
        ]);

        if (!part1 || !part2) {
            throw new NotFoundException('One or both users not found');
        }

        const existing = await this.conversationRepo.findOne({
            where: {
                participantOneId: p1,
                participantTwoId: p2
            },
            relations: ['lastMessage']
        });


        if (existing) {
            const queryBuilder = this.messageRepo.createQueryBuilder('message');
            queryBuilder.where('message.conversationId = :conversationId', { conversationId: existing.id });
            const result = await CRUD.paginateCursor(queryBuilder, 'message');

            const initialMessages = {
                messages: result.items,
                nextCursor: result.nextCursor,
                hasMore: result.hasMore
            }
            return {
                conversation: existing,
                ...initialMessages
            };
        }

        const supportUserId = part1.role === UserRole.ADMIN ? part1.id : part2.role === UserRole.ADMIN ? part2.id : null;
        // 3. Create new if not found
        const conversation = this.conversationRepo.create({
            participantOneId: p1,
            participantTwoId: p2,
            supportUserId: supportUserId,
            lastMessageId: null
        });

        const saved = await this.conversationRepo.save(conversation);

        return {
            conversation: saved
        }
    }


    async findMyConversations(userId: string, cursor?: { createdAt: Date; id: string }, limit: number = 20) {
        const existingUser = await this.userRepo.findOne({ where: { id: userId } });
        if (!existingUser) {
            throw new NotFoundException('User not found');
        }

        const queryBuilder = this.conversationRepo.createQueryBuilder('conversation');

        queryBuilder.where(
            '(conversation.participantOneId = :userId OR conversation.participantTwoId = :userId)',
            { userId }
        );


        queryBuilder
            .leftJoinAndSelect('conversation.lastMessage', 'lastMessage')
            .leftJoinAndSelect('conversation.participantOne', 'participantOne')
            .leftJoinAndSelect('conversation.participantTwo', 'participantTwo');


        const result = await CRUD.paginateCursor(queryBuilder, 'conversation', cursor, limit,);

        return {
            conversations: result.items,
            nextCursor: result.nextCursor,
            hasMore: result.hasMore
        };
    }


    async sendMessage(senderId: string, conversationId: string, content: string) {
        // 1. Verify conversation exists
        const conversation = await this.conversationRepo.findOne({
            where: { id: conversationId },
            relations: ['participantTwo', 'participantOne']
        });

        if (!conversation || senderId !== conversation.participantOneId || senderId !== conversation.participantTwoId) {
            throw new NotFoundException('Conversation not found or access denied');
        }
        // 2. Create and save message
        const message = this.messageRepo.create({
            content,
            senderId,
            conversationId,
        });
        const savedMessage = await this.messageRepo.save(message);

        const isSenderParticipantOne = senderId === conversation.participantOneId;

        const updateData: any = {
            lastMessageId: savedMessage.id,
        };

        if (isSenderParticipantOne) {
            updateData.unreadCountTwo = () => "unread_count_two + 1";
        } else {
            updateData.unreadCountOne = () => "unread_count_one + 1";
        }
        await this.conversationRepo.update(conversationId, updateData);

        const receiverId = conversation.participantOneId === senderId
            ? conversation.participantTwoId
            : conversation.participantOneId;

        const sender = conversation.participantOneId === senderId ? conversation.participantOne : conversation.participantTwo;

        this.appGateway.sendToUser(receiverId, savedMessage, sender);

        return savedMessage;
    }


    async findAllCursorMessages(conversationId: string, userId: string, cursor?: { createdAt: Date; id: string }, limit: number = 50,) {
        const conversation = await this.conversationRepo.findOne({
            where: { id: conversationId },
        });

        if (!conversation || userId !== conversation.participantOneId || userId !== conversation.participantTwoId) {
            throw new NotFoundException('Conversation not found or access denied');
        }
        const queryBuilder = this.messageRepo.createQueryBuilder('message');
        queryBuilder.where('message.conversationId = :conversationId', { conversationId });
        const result = await CRUD.paginateCursor(queryBuilder, 'message', cursor, limit);

        return {
            messages: result.items,
            nextCursor: result.nextCursor,
            hasMore: result.hasMore
        }
    }

    async markAsRead(conversationId: string, userId: string) {
        const conversation = await this.conversationRepo.findOne({
            where: { id: conversationId },
        });

        if (!conversation || (userId !== conversation.participantOneId && userId !== conversation.participantTwoId)) {
            throw new NotFoundException('Conversation not found or access denied');
        }

        const isParticipantOne = userId === conversation.participantOneId;

        // 1. Reset the specific count for the reader
        const updateData: any = {};
        if (isParticipantOne) {
            // Only reset if it's not already 0
            if (conversation.unreadCountOne > 0) updateData.unreadCountOne = 0;
        } else {
            if (conversation.unreadCountTwo > 0) updateData.unreadCountTwo = 0;
        }

        // Only update DB if there was something to reset
        if (Object.keys(updateData).length > 0) {
            await this.conversationRepo.update(conversationId, updateData);

            // 2. Emit "Conversation Read" event to the OTHER person
            const otherUserId = isParticipantOne ? conversation.participantTwoId : conversation.participantOneId;

            this.appGateway.emitMarkedAsRead(otherUserId, {
                conversationId,
                readByUserId: userId,
                readAt: new Date()
            });
        }

        return { success: true };
    }


    async getGlobalUnreadCount(userId: string) {

        const result = await this.conversationRepo
            .createQueryBuilder('c')
            .select(`
            SUM(
                CASE 
                    WHEN c.participantOneId = :userId THEN c.unreadCountOne 
                    WHEN c.participantTwoId = :userId THEN c.unreadCountTwo 
                    ELSE 0 
                END
            )`, 'total')
            .where('c.participantOneId = :userId OR c.participantTwoId = :userId', { userId })
            .getRawOne();

        return {
            totalUnread: Number(result.total) || 0
        };
    }
}