-- CreateTable
CREATE TABLE "job_lock" (
    "name" TEXT NOT NULL,
    "token" UUID NOT NULL,
    "locked_at" TIMESTAMP(3) NOT NULL,
    "locked_until" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_lock_pkey" PRIMARY KEY ("name")
);
