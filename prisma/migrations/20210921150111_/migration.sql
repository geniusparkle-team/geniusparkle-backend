/*
  Warnings:

  - A unique constraint covering the columns `[youtubeChannelId]` on the table `account` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[youtubePlaylistId]` on the table `account` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "account" ADD COLUMN     "youtubeChannelId" TEXT,
ADD COLUMN     "youtubePlaylistId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "account_youtubeChannelId_key" ON "account"("youtubeChannelId");

-- CreateIndex
CREATE UNIQUE INDEX "account_youtubePlaylistId_key" ON "account"("youtubePlaylistId");
