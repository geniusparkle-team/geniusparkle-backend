/*
  Warnings:

  - You are about to drop the column `accRole` on the `account` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "accountType" AS ENUM ('student', 'teacher');

-- AlterTable
ALTER TABLE "account" DROP COLUMN "accRole",
ADD COLUMN     "type" "accountType" NOT NULL DEFAULT E'student';
