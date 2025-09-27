-- CreateEnum
CREATE TYPE "public"."media_usage" AS ENUM ('TEAM_PHOTO');

ALTER TABLE "public"."event"
    RENAME COLUMN "is_feedback_visible" TO "feedback_visible";
ALTER TABLE "public"."event"
    RENAME COLUMN "is_read_only" TO "read_only";

ALTER TABLE "public"."event"
    ADD COLUMN "project_assignments_visible" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "public"."event"
    ADD COLUMN "projects_visible" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "public"."event"
    ALTER COLUMN "feedback_visible" SET DEFAULT false;
ALTER TABLE "public"."event"
    ALTER COLUMN "read_only" SET DEFAULT true;

-- AlterTable
ALTER TABLE "public"."team"
    ADD COLUMN "ai_api_key" TEXT,
    ADD COLUMN "photo_id"   UUID;

-- CreateTable
CREATE TABLE "public"."upload"
(
    "id"             UUID                   NOT NULL DEFAULT gen_random_uuid(),
    "user_id"        UUID                   NOT NULL,
    "usage"          "public"."media_usage" NOT NULL,
    "content_type"   TEXT                   NOT NULL,
    "content_length" BIGINT                 NOT NULL,
    "requested_at"   TIMESTAMP(3)           NOT NULL,
    "uploaded_at"    TIMESTAMP(3),
    "validated_at"   TIMESTAMP(3),

    CONSTRAINT "upload_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."team"
    ADD CONSTRAINT "team_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "public"."upload" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."upload"
    ADD CONSTRAINT "upload_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
