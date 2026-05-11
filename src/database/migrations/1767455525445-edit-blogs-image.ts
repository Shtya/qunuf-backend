import { MigrationInterface, QueryRunner } from 'typeorm';

export class EditBlogs1767455525445 implements MigrationInterface {
    name = 'EditBlogs1767455525445';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "blogs"
            ALTER COLUMN "imagePath" SET NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "blogs"
            ALTER COLUMN "imagePath" DROP NOT NULL
        `);
    }
}
