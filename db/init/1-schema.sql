-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."event_visibility" AS ENUM ('HIDDEN', 'INTERNAL', 'PUBLIC');

-- CreateEnum
CREATE TYPE "public"."event_phase" AS ENUM ('REGISTRATION', 'HACKING', 'GRADING', 'FINISHED');

-- CreateEnum
CREATE TYPE "public"."event_role" AS ENUM ('ADMIN', 'MENTOR', 'STAKEHOLDER', 'PARTICIPANT', 'SIDEQUEST_MASTER');

-- CreateEnum
CREATE TYPE "public"."team_role" AS ENUM ('MENTOR', 'MEMBER');

-- CreateEnum
CREATE TYPE "public"."expert_rating_category" AS ENUM ('FUNCTIONALITY', 'UX', 'PRESENTATION');

-- CreateEnum
CREATE TYPE "public"."media_usage" AS ENUM ('TEAM_PHOTO');

-- CreateTable
CREATE TABLE "public"."event" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "welcome_content" TEXT,
    "documentation_content" TEXT,
    "max_team_size" INTEGER NOT NULL,
    "max_teams_per_project" INTEGER NOT NULL DEFAULT 2,
    "sidequest_cooldown" INTEGER NOT NULL,
    "read_only" BOOLEAN NOT NULL DEFAULT true,
    "projects_visible" BOOLEAN NOT NULL DEFAULT false,
    "project_assignments_visible" BOOLEAN NOT NULL DEFAULT false,
    "feedback_visible" BOOLEAN NOT NULL DEFAULT false,
    "visibility" "public"."event_visibility" NOT NULL,
    "phase" "public"."event_phase" NOT NULL,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."team" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "project_id" UUID,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "password" TEXT,
    "ai_api_key" TEXT,
    "extra_score" DOUBLE PRECISION,
    "comment" TEXT,
    "photo_id" UUID,

    CONSTRAINT "team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "auth_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "index" INTEGER NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_role_assignment" (
    "user_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "role" "public"."event_role" NOT NULL,

    CONSTRAINT "event_role_assignment_pkey" PRIMARY KEY ("user_id","event_id","role")
);

-- CreateTable
CREATE TABLE "public"."team_role_assignment" (
    "user_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "role" "public"."team_role" NOT NULL,

    CONSTRAINT "team_role_assignment_pkey" PRIMARY KEY ("user_id","team_id","role")
);

-- CreateTable
CREATE TABLE "public"."project" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."project_preference" (
    "team_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "score" INTEGER NOT NULL,

    CONSTRAINT "project_preference_pkey" PRIMARY KEY ("team_id","project_id")
);

-- CreateTable
CREATE TABLE "public"."expert_rating" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "team_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category" "public"."expert_rating_category" NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "expert_rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sidequest" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "is_higher_result_better" BOOLEAN NOT NULL,

    CONSTRAINT "sidequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sidequest_attempt" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sidequest_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "result" DOUBLE PRECISION NOT NULL,
    "attempted_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sidequest_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sidequest_score" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "team_id" UUID NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "valid_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sidequest_score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."appointment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3),

    CONSTRAINT "appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."upload" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "usage" "public"."media_usage" NOT NULL,
    "content_type" TEXT NOT NULL,
    "content_length" BIGINT NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL,
    "uploaded_at" TIMESTAMP(3),
    "validated_at" TIMESTAMP(3),

    CONSTRAINT "upload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_name_key" ON "public"."event"("name");

-- CreateIndex
CREATE UNIQUE INDEX "event_slug_key" ON "public"."event"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "team_event_id_name_key" ON "public"."team"("event_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "team_event_id_slug_key" ON "public"."team"("event_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "user_auth_id_key" ON "public"."user"("auth_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_name_index_key" ON "public"."user"("name", "index");

-- CreateIndex
CREATE UNIQUE INDEX "project_event_id_name_key" ON "public"."project"("event_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "project_event_id_slug_key" ON "public"."project"("event_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "expert_rating_team_id_user_id_category_key" ON "public"."expert_rating"("team_id", "user_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "sidequest_event_id_name_key" ON "public"."sidequest"("event_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "sidequest_event_id_slug_key" ON "public"."sidequest"("event_id", "slug");

-- AddForeignKey
ALTER TABLE "public"."team" ADD CONSTRAINT "team_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."team" ADD CONSTRAINT "team_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."team" ADD CONSTRAINT "team_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "public"."upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_role_assignment" ADD CONSTRAINT "event_role_assignment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_role_assignment" ADD CONSTRAINT "event_role_assignment_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."team_role_assignment" ADD CONSTRAINT "team_role_assignment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."team_role_assignment" ADD CONSTRAINT "team_role_assignment_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project" ADD CONSTRAINT "project_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_preference" ADD CONSTRAINT "project_preference_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_preference" ADD CONSTRAINT "project_preference_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expert_rating" ADD CONSTRAINT "expert_rating_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expert_rating" ADD CONSTRAINT "expert_rating_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sidequest" ADD CONSTRAINT "sidequest_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sidequest_attempt" ADD CONSTRAINT "sidequest_attempt_sidequest_id_fkey" FOREIGN KEY ("sidequest_id") REFERENCES "public"."sidequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sidequest_attempt" ADD CONSTRAINT "sidequest_attempt_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sidequest_score" ADD CONSTRAINT "sidequest_score_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointment" ADD CONSTRAINT "appointment_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."upload" ADD CONSTRAINT "upload_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

