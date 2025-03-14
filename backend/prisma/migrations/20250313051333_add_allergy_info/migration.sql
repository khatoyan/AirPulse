-- AlterTable
ALTER TABLE "User" ADD COLUMN     "allergyLevel" INTEGER,
ADD COLUMN     "allergyTypes" TEXT[],
ADD COLUMN     "hasAllergy" BOOLEAN NOT NULL DEFAULT false;
