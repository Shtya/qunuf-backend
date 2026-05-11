import { MigrationInterface, QueryRunner } from "typeorm";

export class EditBlogs1767713544823 implements MigrationInterface {
    name = 'EditBlogs1767713544823'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "title_ar" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "title_en" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "description_ar" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "description_en" text NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "description_en"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "description_ar"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "title_en"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "title_ar"`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "description" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "title" character varying(255) NOT NULL`);
    }

}
