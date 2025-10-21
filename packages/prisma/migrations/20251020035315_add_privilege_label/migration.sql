/*
  Warnings:

  - Added the required column `label` to the `Privilege` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Privilege" ADD COLUMN     "label" TEXT NOT NULL;
