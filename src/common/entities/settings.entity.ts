import { Column, Entity } from "typeorm";
import { CoreEntity } from "./coreEntity";



@Entity('settings')
export class Settings extends CoreEntity {
    @Column({ type: 'text', nullable: true })
    vision: string | null;

    @Column({ type: 'text', nullable: true })
    goals: string | null;

    @Column({ type: 'text', nullable: true })
    missions: string | null;

    @Column({ name: "privacy_policy", type: 'text', nullable: true })
    privacyPolicy: string | null;

    @Column({ name: "terms_of_service", type: 'text', nullable: true })
    termsOfService: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    facebook: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    twitter: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    instagram: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    linkedin: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    pinterest: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    tiktok: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    youtube: string | null;

    @Column({ name: "platform_percent", type: 'decimal', precision: 12, scale: 2, default: 0 })
    platformPercent: number;

    @Column({ name: "contact_email", type: 'varchar', length: 255, nullable: true })
    contactEmail: string | null;

    @Column({ name: 'contact_phone', type: 'varchar', length: 50, nullable: true })
    contactPhone: string | null;

    @Column({ name: 'name', type: 'varchar', length: 255, nullable: true })
    name: string | null;

    @Column({ type: 'text', nullable: true })
    address: string | null;
}