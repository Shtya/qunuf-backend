import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTables1764626747773 implements MigrationInterface {
    name = 'CreateTables1764626747773'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "States" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying(255) NOT NULL, CONSTRAINT "UQ_232d86b41a3b0595bb7640301b8" UNIQUE ("name"), CONSTRAINT "PK_4a6724bf35d29e122d0cb0eb313" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "PropertyTypes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying(50) NOT NULL, CONSTRAINT "UQ_cca7ceee1284556a589fba4623a" UNIQUE ("name"), CONSTRAINT "PK_10a82f7250c0006ecb8fe4ccf0e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "PropertySubtypes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "property_type_id" uuid NOT NULL, "name" character varying(50) NOT NULL, CONSTRAINT "PK_627915ebb4cad7a1845e3fd7404" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."properties_rent_type_enum" AS ENUM('monthly', 'yearly')`);
        await queryRunner.query(`CREATE TYPE "public"."properties_status_enum" AS ENUM('pending', 'active', 'inactive')`);
        await queryRunner.query(`CREATE TYPE "public"."properties_furnished_type_enum" AS ENUM('furnished', 'Unfurnished')`);
        await queryRunner.query(`CREATE TABLE "properties" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying(255) NOT NULL, "landlord_id" uuid NOT NULL, "description" text NOT NULL, "additionalDetails" text NOT NULL, "price" numeric(12,2) NOT NULL, "rent_type" "public"."properties_rent_type_enum" NOT NULL DEFAULT 'monthly', "bedrooms" integer NOT NULL, "bathrooms" integer NOT NULL, "kitchen" integer NOT NULL, "parking" integer NOT NULL, "year_built" integer NOT NULL, "square_feet" integer NOT NULL, "garages" integer NOT NULL, "max_guests" integer, "status" "public"."properties_status_enum" NOT NULL DEFAULT 'pending', "rented" boolean NOT NULL DEFAULT false, "furnished_type" "public"."properties_furnished_type_enum" NOT NULL, "property_type_id" uuid NOT NULL, "property_subtype_id" uuid NOT NULL, "images" jsonb NOT NULL, "features" jsonb NOT NULL, "state_id" uuid NOT NULL, "address" character varying(255), "latitude" numeric(10,8) NOT NULL, "longitude" numeric(11,8) NOT NULL, "education_institutions" jsonb, "health_medical_facilities" jsonb, CONSTRAINT "PK_2d83bfa0b9fcd45dee1785af44d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "PropertySubtypes" ADD CONSTRAINT "FK_f0cdfd23fbf97a9f40d50e02d28" FOREIGN KEY ("property_type_id") REFERENCES "PropertyTypes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "properties" ADD CONSTRAINT "FK_57f44106ee0efc1ff2bdc8c179a" FOREIGN KEY ("landlord_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "properties" ADD CONSTRAINT "FK_21050016bee57be0b28e2c7ad97" FOREIGN KEY ("property_type_id") REFERENCES "PropertyTypes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "properties" ADD CONSTRAINT "FK_2f661c0cd56918c69c7f2c4dcc1" FOREIGN KEY ("property_subtype_id") REFERENCES "PropertySubtypes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "properties" ADD CONSTRAINT "FK_b6be112017726bd0911f487aa01" FOREIGN KEY ("state_id") REFERENCES "States"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "properties" DROP CONSTRAINT "FK_b6be112017726bd0911f487aa01"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP CONSTRAINT "FK_2f661c0cd56918c69c7f2c4dcc1"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP CONSTRAINT "FK_21050016bee57be0b28e2c7ad97"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP CONSTRAINT "FK_57f44106ee0efc1ff2bdc8c179a"`);
        await queryRunner.query(`ALTER TABLE "PropertySubtypes" DROP CONSTRAINT "FK_f0cdfd23fbf97a9f40d50e02d28"`);
        await queryRunner.query(`DROP TABLE "properties"`);
        await queryRunner.query(`DROP TYPE "public"."properties_furnished_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."properties_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."properties_rent_type_enum"`);
        await queryRunner.query(`DROP TABLE "PropertySubtypes"`);
        await queryRunner.query(`DROP TABLE "PropertyTypes"`);
        await queryRunner.query(`DROP TABLE "States"`);
    }

}
