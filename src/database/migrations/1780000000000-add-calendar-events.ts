import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCalendarEvents1780000000000 implements MigrationInterface {
    name = 'AddCalendarEvents1780000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."calendar_events_event_type_enum" AS ENUM('custom', 'reminder')`);
        await queryRunner.query(`
            CREATE TABLE "calendar_events" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "user_id" uuid NOT NULL,
                "title" character varying(255) NOT NULL,
                "description" text,
                "start_date" TIMESTAMP WITH TIME ZONE NOT NULL,
                "end_date" TIMESTAMP WITH TIME ZONE,
                "all_day" boolean NOT NULL DEFAULT false,
                "color" character varying(20),
                "event_type" "public"."calendar_events_event_type_enum" NOT NULL DEFAULT 'custom',
                "url" character varying(500),
                CONSTRAINT "PK_calendar_events" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "calendar_events"
            ADD CONSTRAINT "FK_calendar_events_user"
            FOREIGN KEY ("user_id") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`CREATE INDEX "IDX_calendar_events_user_id" ON "calendar_events" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_calendar_events_start_date" ON "calendar_events" ("start_date")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_calendar_events_start_date"`);
        await queryRunner.query(`DROP INDEX "IDX_calendar_events_user_id"`);
        await queryRunner.query(`ALTER TABLE "calendar_events" DROP CONSTRAINT "FK_calendar_events_user"`);
        await queryRunner.query(`DROP TABLE "calendar_events"`);
        await queryRunner.query(`DROP TYPE "public"."calendar_events_event_type_enum"`);
    }
}
