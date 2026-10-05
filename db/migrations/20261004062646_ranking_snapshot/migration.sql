-- AlterTable
ALTER TABLE "event" ADD COLUMN     "current_ranking_snapshot_id" UUID;

-- CreateTable
CREATE TABLE "ranking_snapshot" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" JSONB NOT NULL,

    CONSTRAINT "ranking_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_current_ranking_snapshot_id_key" ON "event"("current_ranking_snapshot_id");

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_current_ranking_snapshot_id_fkey" FOREIGN KEY ("current_ranking_snapshot_id") REFERENCES "ranking_snapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_snapshot" ADD CONSTRAINT "ranking_snapshot_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

