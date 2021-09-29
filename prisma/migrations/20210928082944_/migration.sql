/*
  Warnings:

  - You are about to drop the column `age` on the `account` table. All the data in the column will be lost.
  - Added the required column `birthday` to the `account` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "account" DROP COLUMN "age",
DROP COLUMN "birthday",
ADD COLUMN     "birthday" DATE NOT NULL;
