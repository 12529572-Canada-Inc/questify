-- CreateEnum
CREATE TYPE "QuestStatus" AS ENUM ('draft', 'active', 'completed', 'failed', 'archived');

-- AlterTable
ALTER TABLE "Quest" ADD COLUMN     "deletedAt" TIMESTAMP(3);
ALTER TABLE "Quest" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Quest" ALTER COLUMN "status" TYPE "QuestStatus" USING "status"::text::"QuestStatus";
ALTER TABLE "Quest" ALTER COLUMN "status" SET DEFAULT 'draft';
