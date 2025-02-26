-- CreateEnum
CREATE TYPE "event_visibility" AS ENUM ('HIDDEN', 'INTERNAL', 'PUBLIC');

-- CreateEnum
CREATE TYPE "event_phase" AS ENUM ('REGISTRATION', 'HACKING', 'GRADING', 'FINISHED');

-- CreateEnum
CREATE TYPE "event_role" AS ENUM ('ADMIN', 'MENTOR', 'STAKEHOLDER', 'PARTICIPANT', 'SIDEQUEST_MASTER');

-- CreateEnum
CREATE TYPE "team_role" AS ENUM ('MENTOR', 'MEMBER');

-- CreateEnum
CREATE TYPE "expert_rating_category" AS ENUM ('FUNCTIONALITY', 'UX', 'PRESENTATION');

-- CreateTable
CREATE TABLE "event" (
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
    "is_read_only" BOOLEAN NOT NULL,
    "is_feedback_visible" BOOLEAN NOT NULL,
    "visibility" "event_visibility" NOT NULL,
    "phase" "event_phase" NOT NULL,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "project_id" UUID,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "password" TEXT,
    "extra_score" DOUBLE PRECISION,
    "comment" TEXT,

    CONSTRAINT "team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "auth_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "index" INTEGER NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_role_assignment" (
    "user_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "role" "event_role" NOT NULL,

    CONSTRAINT "event_role_assignment_pkey" PRIMARY KEY ("user_id","event_id","role")
);

-- CreateTable
CREATE TABLE "team_role_assignment" (
    "user_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "role" "team_role" NOT NULL,

    CONSTRAINT "team_role_assignment_pkey" PRIMARY KEY ("user_id","team_id","role")
);

-- CreateTable
CREATE TABLE "project" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_preference" (
    "team_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "score" INTEGER NOT NULL,

    CONSTRAINT "project_preference_pkey" PRIMARY KEY ("team_id","project_id")
);

-- CreateTable
CREATE TABLE "expert_rating" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "team_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category" "expert_rating_category" NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "expert_rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sidequest" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "is_higher_result_better" BOOLEAN NOT NULL,

    CONSTRAINT "sidequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sidequest_attempt" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sidequest_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "result" DOUBLE PRECISION NOT NULL,
    "attempted_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sidequest_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sidequest_score" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "team_id" UUID NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "valid_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sidequest_score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3),

    CONSTRAINT "appointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_name_key" ON "event"("name");

-- CreateIndex
CREATE UNIQUE INDEX "event_slug_key" ON "event"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "team_event_id_name_key" ON "team"("event_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "team_event_id_slug_key" ON "team"("event_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "user_auth_id_key" ON "user"("auth_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_name_index_key" ON "user"("name", "index");

-- CreateIndex
CREATE UNIQUE INDEX "project_event_id_name_key" ON "project"("event_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "project_event_id_slug_key" ON "project"("event_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "expert_rating_team_id_user_id_category_key" ON "expert_rating"("team_id", "user_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "sidequest_event_id_name_key" ON "sidequest"("event_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "sidequest_event_id_slug_key" ON "sidequest"("event_id", "slug");

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_role_assignment" ADD CONSTRAINT "event_role_assignment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_role_assignment" ADD CONSTRAINT "event_role_assignment_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_role_assignment" ADD CONSTRAINT "team_role_assignment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_role_assignment" ADD CONSTRAINT "team_role_assignment_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_preference" ADD CONSTRAINT "project_preference_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_preference" ADD CONSTRAINT "project_preference_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expert_rating" ADD CONSTRAINT "expert_rating_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expert_rating" ADD CONSTRAINT "expert_rating_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sidequest" ADD CONSTRAINT "sidequest_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sidequest_attempt" ADD CONSTRAINT "sidequest_attempt_sidequest_id_fkey" FOREIGN KEY ("sidequest_id") REFERENCES "sidequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sidequest_attempt" ADD CONSTRAINT "sidequest_attempt_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sidequest_score" ADD CONSTRAINT "sidequest_score_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

