-- CreateEnum
CREATE TYPE "blog_section_layout" AS ENUM ('IMAGE_TOP', 'IMAGE_BOTTOM', 'IMAGE_LEFT', 'IMAGE_RIGHT');

-- AlterEnum
ALTER TYPE "media_usage" ADD VALUE 'TEAM_BLOG_IMAGE';

-- CreateTable
CREATE TABLE "team_blog_section" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "team_id" UUID NOT NULL,
    "image_id" UUID,
    "position" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "layout" "blog_section_layout" NOT NULL,

    CONSTRAINT "team_blog_section_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_blog_section_team_id_position_key" ON "team_blog_section"("team_id", "position");

-- AddForeignKey
ALTER TABLE "team_blog_section" ADD CONSTRAINT "team_blog_section_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_blog_section" ADD CONSTRAINT "team_blog_section_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;
