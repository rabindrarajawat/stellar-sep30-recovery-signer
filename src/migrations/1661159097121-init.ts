import {MigrationInterface, QueryRunner} from "typeorm";

export class init1661159097121 implements MigrationInterface {
    name = 'init1661159097121'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "sep30_account_signers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "public_key" character varying NOT NULL, "fireblocks_vault_id" character varying, CONSTRAINT "UQ_cc6ada03d6f37fee591d51f794f" UNIQUE ("public_key"), CONSTRAINT "PK_ce47ac01ce0ded816cb28ce898f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sep30_auth_methods" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "type" text NOT NULL, "value" text NOT NULL, "identity_id" uuid, CONSTRAINT "PK_d1d16c03e565888a7f2cbfed2a2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_00d17871e9ff5f54223e2804f4" ON "sep30_auth_methods" ("type", "value", "identity_id") `);
        await queryRunner.query(`CREATE TABLE "sep30_identities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "role" character varying NOT NULL, "account_id" uuid, CONSTRAINT "PK_d05bda96d2d7c80142fd607616f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sep30_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "address" character varying NOT NULL, CONSTRAINT "UQ_47c04fba92043520aca1ed5772b" UNIQUE ("address"), CONSTRAINT "PK_83672f07c7f027b3f1b5cbc3d14" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sep30_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "status" text NOT NULL, "unsigned_stellar_xdr" text NOT NULL, "signature" text, "fireblocks_id" text, CONSTRAINT "PK_a68ec500fb2bea40859d025150a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "sep30_auth_methods" ADD CONSTRAINT "FK_efe0316e347bf21ef989162f2a4" FOREIGN KEY ("identity_id") REFERENCES "sep30_identities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sep30_identities" ADD CONSTRAINT "FK_1273e5e932e193dfe1a27eda8cb" FOREIGN KEY ("account_id") REFERENCES "sep30_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sep30_identities" DROP CONSTRAINT "FK_1273e5e932e193dfe1a27eda8cb"`);
        await queryRunner.query(`ALTER TABLE "sep30_auth_methods" DROP CONSTRAINT "FK_efe0316e347bf21ef989162f2a4"`);
        await queryRunner.query(`DROP TABLE "sep30_transactions"`);
        await queryRunner.query(`DROP TABLE "sep30_accounts"`);
        await queryRunner.query(`DROP TABLE "sep30_identities"`);
        await queryRunner.query(`DROP INDEX "IDX_00d17871e9ff5f54223e2804f4"`);
        await queryRunner.query(`DROP TABLE "sep30_auth_methods"`);
        await queryRunner.query(`DROP TABLE "sep30_account_signers"`);
    }

}
