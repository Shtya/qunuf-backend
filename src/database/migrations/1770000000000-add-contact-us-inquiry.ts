import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContactUsInquiry1770000000000 implements MigrationInterface {
    name = 'AddContactUsInquiry1770000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contact_us_messages" ADD "inquiry" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contact_us_messages" DROP COLUMN "inquiry"`);
    }
}
