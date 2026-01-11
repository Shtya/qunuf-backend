import { Column, Entity } from "typeorm";
import { CoreEntity } from "./coreEntity";



@Entity('settings')
export class Settings extends CoreEntity {
    @Column({ name: "privacy_policy_en", type: 'text', nullable: true })
    privacyPolicy_en: string | null;

    @Column({ name: "terms_of_service_en", type: 'text', nullable: true })
    termsOfService_en: string | null;

    @Column({ name: "privacy_policy_ar", type: 'text', nullable: true })
    privacyPolicy_ar: string | null;

    @Column({ name: "terms_of_service_ar", type: 'text', nullable: true })
    termsOfService_ar: string | null;

    @Column({ type: 'text', nullable: true })
    address: string | null;

    @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
    latitude: number | null;

    @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
    longitude: number | null;

    @Column({ name: "contact_email", type: 'varchar', length: 255, nullable: true })
    contactEmail: string | null;

    @Column({ name: 'contact_phone', type: 'varchar', length: 50, nullable: true })
    contactPhone: string | null;

    @Column({ type: 'text', nullable: true })
    description_ar: string | null;

    @Column({ type: 'text', nullable: true })
    description_en: string | null;

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

    @Column({ name: "fax", type: 'varchar', length: 50, nullable: true })
    fax: string | null;

    @Column({ name: "platform_percent", type: 'decimal', precision: 12, scale: 2, default: 0 })
    platformPercent: number;

    @Column({ name: 'name', type: 'varchar', length: 255, nullable: true })
    name: string | null;

    @Column({ type: 'text', nullable: true, name: 'default_contract_terms' })
    defaultContractTerms: string;
}