/*
  Warnings:

  - This migration deletes rows using enum values [FUNCTIONALITY,UX] before updating the enum type.

*/

BEGIN;

-- 1. Delete rows that use deprecated enum values
DELETE FROM "expert_rating"
WHERE "category" IN ('FUNCTIONALITY', 'UX');

-- 2. Proceed with enum alteration
CREATE TYPE "expert_rating_category_new" AS ENUM ('PRODUCT', 'PRESENTATION');
ALTER TABLE "expert_rating"
  ALTER COLUMN "category"
  TYPE "expert_rating_category_new"
  USING ("category"::text::"expert_rating_category_new");

ALTER TYPE "expert_rating_category" RENAME TO "expert_rating_category_old";
ALTER TYPE "expert_rating_category_new" RENAME TO "expert_rating_category";
DROP TYPE "public"."expert_rating_category_old";

COMMIT;
-- AlterTable
ALTER TABLE "event" ADD COLUMN     "finalists_visible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "voting_open" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "team" ADD COLUMN     "finalist" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "vote" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rank" INTEGER NOT NULL,
    "team_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technical_question" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "description" TEXT,
    "min_points" INTEGER NOT NULL,
    "max_points" INTEGER NOT NULL,
    "binary" BOOLEAN NOT NULL,

    CONSTRAINT "technical_question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technical_rating" (
    "technical_question_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "technical_rating_pkey" PRIMARY KEY ("technical_question_id","team_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vote_team_id_user_id_rank_key" ON "vote"("team_id", "user_id", "rank");

-- AddForeignKey
ALTER TABLE "vote" ADD CONSTRAINT "vote_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vote" ADD CONSTRAINT "vote_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technical_question" ADD CONSTRAINT "technical_question_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technical_rating" ADD CONSTRAINT "technical_rating_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technical_rating" ADD CONSTRAINT "technical_rating_technical_question_id_fkey" FOREIGN KEY ("technical_question_id") REFERENCES "technical_question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
