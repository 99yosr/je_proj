/*
  Warnings:

  - You are about to drop the column `authorId` on the `News` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "News" DROP CONSTRAINT "News_authorId_fkey";

-- AlterTable
ALTER TABLE "News" DROP COLUMN "authorId",
ADD COLUMN     "author" TEXT;
