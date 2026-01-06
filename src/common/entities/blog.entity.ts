import { BeforeInsert, BeforeUpdate, Column, Entity, Index } from "typeorm";
import { CoreEntity } from "./coreEntity";


@Entity('blogs')
@Index('idx_blog_created_at_id', ['created_at', 'id'])
export class Blog extends CoreEntity {
    @Column({ length: 255 })
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'varchar', length: 1024, nullable: true })
    imagePath: string | null;

    @Column({ unique: true })
    slug: string;



    @BeforeInsert()
    @BeforeUpdate() // Keeps the slug in sync if the title changes
    generateSlug() {
        if (this.title) {
            this.slug = this.title
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