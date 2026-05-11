import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserGoogleCredentials1780000000001 implements MigrationInterface {
    name = 'AddUserGoogleCredentials1780000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "user_google_credentials" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "user_id" uuid NOT NULL,
                "client_id" text NOT NULL,
                "client_secret" text NOT NULL,
                CONSTRAINT "PK_user_google_credentials" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "user_google_credentials"
            ADD CONSTRAINT "FK_user_google_credentials_user"
            FOREIGN KEY ("user_id") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_user_google_credentials_user_id"
            ON "user_google_credentials" ("user_id")
            WHERE "deleted_at" IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "UQ_user_google_credentials_user_id"`);
        await queryRunner.query(`ALTER TABLE "user_google_credentials" DROP CONSTRAINT "FK_user_google_credentials_user"`);
        await queryRunner.query(`DROP TABLE "user_google_credentials"`);
    }
}
