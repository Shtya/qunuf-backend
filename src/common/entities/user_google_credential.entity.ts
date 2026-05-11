import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { CoreEntity } from './coreEntity';
import { User } from './user.entity';

@Entity('user_google_credentials')
@Index('UQ_user_google_credentials_user_id', ['userId'], { unique: true })
export class UserGoogleCredential extends CoreEntity {

    @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'uuid', name: 'user_id' })
    userId: string;

    @Column({ type: 'text', name: 'client_id' })
    clientId: string;

    @Column({ type: 'text', name: 'client_secret' })
    clientSecret: string;
}
