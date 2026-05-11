import { Column, Entity } from "typeorm";
import { CoreEntity } from "./coreEntity";
import { ApiProperty } from "@nestjs/swagger";

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
        unique: true
    })
    section: string;

    @Column({ length: 255 })
    title_ar: string;

    @Column({ length: 255 })
    title_en: string;

    @Column({ type: 'text', name: 'text_en' })
    content_en: string | null;

    @Column({ type: 'text', name: 'text_ar' })
    content_ar: string | null;

    @Column({ type: 'varchar', length: 1024, nullable: true })
    @ApiProperty({ description: 'Image file path (relative to project root)', required: false })
    imagePath: string | null;
}
