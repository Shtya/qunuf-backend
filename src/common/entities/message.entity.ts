import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Conversation } from "./conversation.entity";
import { CoreEntity } from "./coreEntity";
import { User } from "./user.entity";


@Entity('messages')
@Index('idx_message_created_at_id', ['created_at', 'id'])
export class Message extends CoreEntity {
    @ManyToOne('Conversation', 'Message')
    @JoinColumn({ name: 'conversation_id' })
    conversation: Conversation;

    @Column({ name: 'conversation_id' })
    conversationId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'sender_id' })
    sender: User;

    @Column({ name: 'sender_id' })
    senderId: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
    readAt: Date;
}
