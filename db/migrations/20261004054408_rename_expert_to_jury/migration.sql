-- Rename expert_rating to jury_rating (data-preserving; Prisma would DROP/CREATE)
ALTER TYPE "expert_rating_category" RENAME TO "jury_rating_category";
ALTER TABLE "expert_rating" RENAME TO "jury_rating";
ALTER TABLE "jury_rating" RENAME CONSTRAINT "expert_rating_pkey" TO "jury_rating_pkey";
ALTER INDEX "expert_rating_team_id_user_id_category_key" RENAME TO "jury_rating_team_id_user_id_category_key";
ALTER TABLE "jury_rating" RENAME CONSTRAINT "expert_rating_team_id_fkey" TO "jury_rating_team_id_fkey";
ALTER TABLE "jury_rating" RENAME CONSTRAINT "expert_rating_user_id_fkey" TO "jury_rating_user_id_fkey";
