-- AlterTable
ALTER TABLE "event" ADD COLUMN     "discord_server_id" TEXT;

-- CreateTable
CREATE TABLE "event_user_discord_id" (
    "event_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "discord_id" TEXT NOT NULL,

    CONSTRAINT "event_user_discord_id_pkey" PRIMARY KEY ("user_id","event_id")
);

-- AddForeignKey
ALTER TABLE "event_user_discord_id" ADD CONSTRAINT "event_user_discord_id_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_user_discord_id" ADD CONSTRAINT "event_user_discord_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
