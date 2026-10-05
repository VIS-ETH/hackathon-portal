-- Rename vote.rank to vote.place (data-preserving; Prisma would DROP/ADD)
ALTER TABLE "vote" RENAME COLUMN "rank" TO "place";
ALTER INDEX "vote_team_id_user_id_rank_key" RENAME TO "vote_team_id_user_id_place_key";
