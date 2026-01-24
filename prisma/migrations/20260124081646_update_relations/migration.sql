/*
  Warnings:

  - You are about to drop the column `author` on the `News` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "News" DROP COLUMN "author",
ADD COLUMN     "authorId" TEXT;

-- AddForeignKey
ALTER TABLE "News" ADD CONSTRAINT "News_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
