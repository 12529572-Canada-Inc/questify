/*
  Warnings:

  - Added the required column `updatedAt` to the `Quest` table without a default value. This is not possible if the table is not empty.
  - Made the column `ownerId` on table `Quest` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Quest" DROP CONSTRAINT "Quest_ownerId_fkey";

-- AlterTable
ALTER TABLE "Quest" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "ownerId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
