/*
  Warnings:

  - You are about to drop the column `status` on the `account` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "account" DROP COLUMN "status",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;
