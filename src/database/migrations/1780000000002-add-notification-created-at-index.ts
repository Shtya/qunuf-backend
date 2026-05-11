import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationCreatedAtIndex1780000000002 implements MigrationInterface {
    name = 'AddNotificationCreatedAtIndex1780000000002';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_notifications_created_at" ON "notifications" ("created_at")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_notifications_created_at"`);
    }
}
