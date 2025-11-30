import { Entity, Column, ManyToOne, JoinColumn, Relation } from 'typeorm';
import type { User } from './user.entity';
import { CoreEntity } from './coreEntity';

@Entity('sessions')
export class Session extends CoreEntity {

    @Column({ type: 'timestamptz', nullable: true, name: 'revoked_at' })
    revokedAt: Date | null;

    @Column({ name: 'user_id' })
    userId: string;

    @Column({ name: 'refresh_token_hash', type: 'varchar', length: 255, nullable: true })
    refreshTokenHash: string | null;


    @Column({ type: 'varchar', length: 100, nullable: true, name: 'ip_address' })
    ipAddress: string | null;

    // Relation to User (string-based to avoid circular dependency)
    @ManyToOne('User', 'Session', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: Relation<User>;
}
