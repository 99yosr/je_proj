/*
  Warnings:

  - Added the required column `juniorId` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "juniorId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_juniorId_fkey" FOREIGN KEY ("juniorId") REFERENCES "Junior"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
