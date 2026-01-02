import { Column, Entity } from "typeorm";
import { CoreEntity } from "./coreEntity";

@Entity('notifications')
export class Notification extends CoreEntity {
    @Column({ name: 'user_id' })
    userId: string;

    @Column()
    type: string;

    @Column()
    title: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ name: 'is_read', default: false })
    isRead: boolean;

    @Column({ name: 'related_entity_type', nullable: true })
    relatedEntityType: string;

    @Column({ name: 'related_entity_id', nullable: true })
    relatedEntityId: string;
}
