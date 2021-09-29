/*
  Warnings:

  - You are about to drop the column `googleAccessToken` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `googleRefreshToken` on the `account` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "account" DROP COLUMN "googleAccessToken",
DROP COLUMN "googleRefreshToken",
ADD COLUMN     "googleTokens" JSON;
