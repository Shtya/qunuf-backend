import { BeforeInsert, BeforeUpdate, Column, Entity, Index } from "typeorm";
import { CoreEntity } from "./coreEntity";
import { ApiProperty } from "@nestjs/swagger";


@Entity('blogs')
@Index('idx_blog_created_at_id', ['created_at', 'id'])
export class Blog extends CoreEntity {
    @Column({ length: 255, name: 'title_ar' })
    @ApiProperty({ description: 'Title in Arabic' })
    title_ar: string;

    @Column({ length: 255, name: 'title_en' })
    @ApiProperty({ description: 'Title in English' })
    title_en: string;

    @Column({ type: 'text', name: 'description_ar' })
    @ApiProperty({ description: 'Description in Arabic', required: true })
    description_ar: string;

    @Column({ type: 'text', name: 'description_en' })
    @ApiProperty({ description: 'Description in English', required: true })
    description_en: string;

    @Column({ type: 'varchar', length: 1024, nullable: false })
    imagePath: string;

    @Column({ unique: true })
    slug: string;


    @BeforeInsert()
    @BeforeUpdate() // Keeps the slug in sync if the title changes
    generateSlug() {
        if (this.title_en) {
            this.slug = this.title_en
                .toLowerCase()
                .trim()
                // 1. Replace everything that is NOT a Unicode Letter/Number, space, or dash with empty string
                .replace(/[^\p{L}\p{N}\s-]/gu, '')
                // 2. Replace spaces with dashes
                .replace(/\s+/g, '-')
                // 3. Remove consecutive dashes
                .replace(/-+/g, '-')
                // 4. Remove leading/trailing dashes (optional but recommended)
                .replace(/^-+|-+$/g, '');
        }

    }
}