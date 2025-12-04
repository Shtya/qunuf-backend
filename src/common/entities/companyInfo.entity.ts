import { Column, Entity } from "typeorm";
import { CoreEntity } from "./coreEntity";

export enum CompanySection {
    VISION = 'vision',
    MISSION = 'mission',
    GOALS = 'goals',
    HISTORY = 'history',
    WHY_US = 'why_us',
}

@Entity('company_info')
export class CompanyInfo extends CoreEntity {
    @Column({
        type: 'enum',
        enum: CompanySection,
        name: 'section_key',
    })
    sectionKey: CompanySection;

    @Column({ length: 255 })
    title: string;

    @Column({ type: 'varchar', length: 10, default: 'en', comment: 'Language code (e.g., en, ar)' })
    lang: string;

    @Column({ type: 'text', name: 'text_en' })
    contentEn: string | null;

    @Column({ type: 'text', name: 'text_ar' })
    contentAr: string | null;
}
