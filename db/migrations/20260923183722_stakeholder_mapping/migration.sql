-- AlterEnum
ALTER TYPE "team_role" ADD VALUE 'STAKEHOLDER';

-- CreateTable
CREATE TABLE "stakeholder_project" (
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "stakeholder_project_pkey" PRIMARY KEY ("project_id","user_id")
);

-- AddForeignKey
ALTER TABLE "stakeholder_project" ADD CONSTRAINT "stakeholder_project_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stakeholder_project" ADD CONSTRAINT "stakeholder_project_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
