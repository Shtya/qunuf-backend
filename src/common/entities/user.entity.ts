
import { Entity, Column, OneToMany, Relation } from "typeorm";
import { CoreEntity } from './coreEntity';
import type { Session } from "./session.entity";

export enum UserRole {
    ADMIN = 'admin',
    TENANT = 'tenant',
    LANDLORD = 'landlord',
}

export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',  // voluntary / time-based inactivity
    PENDING_VERIFICATION = 'pending_verification',
    SUSPENDED = 'suspended',  // admin or violation
    DELETED = 'deleted',
}

@Entity('users')
export class User extends CoreEntity {
    @Column({ unique: true, length: 255 })
    email: string;

    @Column({ length: 255 })
    name: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.TENANT,
    })
    role: UserRole;

    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.PENDING_VERIFICATION,
        name: 'status',
    })
    status: UserStatus;

    @Column({ type: 'text', name: 'password_hash', select: false })
    passwordHash: string;

    @Column({ type: 'varchar', length: 255, nullable: true, select: false, name: 'reset_password_token' })
    resetPasswordToken: string | null;

    @Column({ type: 'timestamptz', nullable: true, select: false, name: 'last_reset_password_sent_at' })
    lastResetPasswordSentAt: Date | null;

    @Column({ type: 'timestamptz', nullable: true, select: false, name: 'reset_password_expires' })
    resetPasswordExpires: Date | null;

    @Column({ type: 'varchar', length: 255, nullable: true, select: false, name: 'email_verification_code' })
    emailVerificationCode: string | null;

    @Column({ type: 'timestamptz', nullable: true, select: false, name: 'email_verification_sent_at' })
    emailVerificationSentAt: Date | null;

    @Column({ type: 'timestamptz', nullable: true, select: false, name: 'email_verification_expires' })
    emailVerificationExpires: Date | null;

    @Column({
        type: 'boolean',
        default: true,
        comment: 'Flag to enable/disable notifications for this user',
        name: 'notifications_enabled',
    })
    notificationsEnabled: boolean;

    @Column({ type: 'timestamptz', nullable: true, name: 'last_login' })
    lastLogin: Date | null;

    @OneToMany('Session', 'user')
    sessions: Relation<Session[]>;

}