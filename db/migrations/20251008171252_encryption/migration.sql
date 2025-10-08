/*
  Warnings:

  - The `password` column on the `team` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `ai_api_key` column on the `team` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "event" ADD COLUMN     "master_ai_api_key" BYTEA;

-- AlterTable
ALTER TABLE "team" DROP COLUMN "password",
ADD COLUMN     "password" BYTEA,
DROP COLUMN "ai_api_key",
ADD COLUMN     "ai_api_key" BYTEA;
