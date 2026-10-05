-- AlterTable
ALTER TABLE "event" ADD COLUMN     "blog_max_characters" INTEGER NOT NULL DEFAULT 20000,
ADD COLUMN     "blog_max_image_size_mb" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "blog_max_images" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "blog_max_sections" INTEGER NOT NULL DEFAULT 20;
