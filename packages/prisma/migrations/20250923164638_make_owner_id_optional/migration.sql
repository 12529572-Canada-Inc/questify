-- DropForeignKey
ALTER TABLE "Quest" DROP CONSTRAINT "Quest_ownerId_fkey";

-- AlterTable
ALTER TABLE "Quest" ALTER COLUMN "ownerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
