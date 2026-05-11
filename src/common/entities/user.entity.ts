
import { Entity, Column, OneToMany, Relation, ManyToOne, JoinColumn, OneToOne } from "typeorm";
import { CoreEntity } from './coreEntity';
import type { Session } from "./session.entity";
import { Country } from "./country.entity";
import { Address } from "./address.entity";

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

export enum IdentityType {
    NATIONAL_ID = 'national_id',              // هوية وطنية
    RESIDENCY = 'residency',                  // هوية مقيم
    PREMIUM_RESIDENCY = 'premium_residency',  // إقامة مميزة
    GCC_ID = 'gcc_id',                        // هوية خليجية
    PASSPORT = 'passport',                    // جواز سفر
    OTHER = 'other',                          // أخرى
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
        select: false
    })
    notificationsEnabled: boolean;

    @Column({ type: 'timestamptz', nullable: true, name: 'last_login' })
    lastLogin: Date | null;

    @ManyToOne(() => Country, { nullable: true })
    @JoinColumn({ name: 'nationalityId' })
    nationality: Country | null;   // nationality

    @Column({ name: 'nationalityId', nullable: true })
    nationalityId: string | null;

    @Column({
        type: 'enum',
        enum: IdentityType,
        nullable: true,
        name: 'identity_type',
        select: false
    })
    identityType: IdentityType | null;

    @Column({ type: 'varchar', length: 255, nullable: true, name: 'identity_number', select: false })
    identityNumber: string | null;

    @Column({ type: 'uuid', name: 'identity_issue_country_id', nullable: true })
    identityIssueCountryId: string | null;

    @ManyToOne(() => Country, { nullable: true })
    @JoinColumn({ name: 'identity_issue_country_id', })
    identityIssueCountry: Country | null;

    @Column({ type: 'varchar', length: 255, nullable: true, name: 'identity_other_type', select: false })
    identityOtherType: string | null;

    @Column({ type: 'timestamptz', nullable: true, name: 'birth_date', select: false })
    birthDate: Date | null;

    @Column({ type: 'varchar', length: 20, nullable: true, name: 'phone_number', select: false })
    phoneNumber: string | null;

    @Column({ name: 'notification_unread_count', default: 0, select: false })
    notificationUnreadCount: number;

    @Column({ name: 'image_path', type: 'varchar', length: 1024, nullable: true })
    imagePath: string | null;

    @Column({ name: 'pending_eeail', type: 'varchar', nullable: true })
    pendingEmail: string | null;

    @Column({ name: 'pending_email_code', type: 'varchar', nullable: true, select: false })
    pendingEmailCode: string | null;

    @Column({ name: 'last_email_change_sent_at', type: 'timestamptz', nullable: true, select: false })
    lastEmailChangeSentAt: Date | null;

    //We will store short address number instead of detailed address
    // @OneToOne("Address", "User", { cascade: true, nullable: true })
    // @JoinColumn({ name: 'address_id' })
    // address?: Relation<Address | null>;

    @Column({ type: 'varchar', name: "short_address", length: 8, nullable: true, })
    shortAddress: string | null;

    @OneToMany('Session', 'User')
    sessions: Relation<Session[]>;

}