-- Add stored image attachments for quests and task investigations
ALTER TABLE "Quest"
ADD COLUMN "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "TaskInvestigation"
ADD COLUMN "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
