-- CreateEnum
CREATE TYPE "secret_scope" AS ENUM ('TEAM', 'USER');

-- CreateTable
CREATE TABLE "secret" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "scope" "secret_scope" NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "secret_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_secret" (
    "secret_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "value" BYTEA NOT NULL,

    CONSTRAINT "team_secret_pkey" PRIMARY KEY ("secret_id","team_id")
);

-- CreateTable
CREATE TABLE "user_secret" (
    "secret_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "value" BYTEA NOT NULL,

    CONSTRAINT "user_secret_pkey" PRIMARY KEY ("secret_id","user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "secret_event_id_scope_name_key" ON "secret"("event_id", "scope", "name");

-- AddForeignKey
ALTER TABLE "secret" ADD CONSTRAINT "secret_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_secret" ADD CONSTRAINT "team_secret_secret_id_fkey" FOREIGN KEY ("secret_id") REFERENCES "secret"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_secret" ADD CONSTRAINT "team_secret_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_secret" ADD CONSTRAINT "user_secret_secret_id_fkey" FOREIGN KEY ("secret_id") REFERENCES "secret"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_secret" ADD CONSTRAINT "user_secret_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- MigrateData
-- The team passwords and AI API keys become team secrets. Both are encrypted with the same key,
-- so the ciphertexts are copied as-is.
INSERT INTO "secret" ("event_id", "scope", "name")
SELECT DISTINCT "event_id", 'TEAM'::"secret_scope", 'VM Password' FROM "team" WHERE "password" IS NOT NULL;

INSERT INTO "team_secret" ("secret_id", "team_id", "value")
SELECT "secret"."id", "team"."id", "team"."password"
FROM "team"
JOIN "secret" ON "secret"."event_id" = "team"."event_id" AND "secret"."scope" = 'TEAM' AND "secret"."name" = 'VM Password'
WHERE "team"."password" IS NOT NULL;

INSERT INTO "secret" ("event_id", "scope", "name")
SELECT DISTINCT "event_id", 'TEAM'::"secret_scope", 'AI API Key' FROM "team" WHERE "ai_api_key" IS NOT NULL;

INSERT INTO "team_secret" ("secret_id", "team_id", "value")
SELECT "secret"."id", "team"."id", "team"."ai_api_key"
FROM "team"
JOIN "secret" ON "secret"."event_id" = "team"."event_id" AND "secret"."scope" = 'TEAM' AND "secret"."name" = 'AI API Key'
WHERE "team"."ai_api_key" IS NOT NULL;

-- AlterTable
ALTER TABLE "team" DROP COLUMN "ai_api_key",
DROP COLUMN "password";
