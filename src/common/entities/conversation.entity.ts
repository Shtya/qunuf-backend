import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne, Relation } from "typeorm";
import { User } from "./user.entity";
import { CoreEntity } from "./coreEntity";
import { Message } from "./message.entity";

@Entity('conversations')
@Index(['participantOneId', 'participantTwoId'], { unique: true })
@Index('idx_conversation_created_at_id', ['created_at', 'id'])
export class Conversation extends CoreEntity {

    @ManyToOne(() => User)
    @JoinColumn({ name: 'participant_one_id' })
    participantOne: User;

    @Column({ name: 'participant_one_id' })
    participantOneId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'participant_two_id' })
    participantTwo: User;

    @Column({ name: 'participant_two_id' })
    participantTwoId: string;

    @Column({ name: 'support_user_id', nullable: true })
    supportUserId: string | null;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'support_user_id' })
    supportUser: User | null;

    @Column({ name: 'last_message_id', nullable: true })
    lastMessageId: string | null;

    @OneToOne('Message', 'conversation', { nullable: true })
    @JoinColumn({ name: 'last_message_id' })
    lastMessage: Relation<Message>;

    @OneToMany('Message', 'Conversation')
    messages: Relation<Message>[];

    @Column({ name: 'unread_count_one', default: 0 })
    unreadCountOne: number;

    @Column({ name: 'unread_count_two', default: 0 })
    unreadCountTwo: number;
}
