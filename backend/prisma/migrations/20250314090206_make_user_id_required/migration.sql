/*
  Warnings:

  - Made the column `userId` on table `Report` required. This step will fail if there are existing NULL values in that column.

*/
-- Update existing records to set userId = 1 for NULL values
UPDATE "Report" SET "userId" = 1 WHERE "userId" IS NULL;

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_userId_fkey";

-- AlterTable
ALTER TABLE "Report" ALTER COLUMN "userId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
