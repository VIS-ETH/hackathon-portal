-- AlterTable
ALTER TABLE "event" RENAME COLUMN "voting_open" TO "public_vote_open";
ALTER TABLE "event" ADD COLUMN "jury_rating_open" BOOLEAN NOT NULL DEFAULT false;
