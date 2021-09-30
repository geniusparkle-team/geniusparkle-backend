-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'unknow');

-- CreateEnum
CREATE TYPE "accountType" AS ENUM ('student', 'teacher');

-- CreateTable
CREATE TABLE "account" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" VARCHAR(45) NOT NULL,
    "password" VARCHAR(150) NOT NULL,
    "birthday" DATE NOT NULL,
    "gender" "Gender" DEFAULT E'unknow',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "verify" BOOLEAN NOT NULL DEFAULT false,
    "avatar" TEXT,
    "type" "accountType" NOT NULL DEFAULT E'student',
    "otherData" VARCHAR(150),
    "note" TEXT,
    "tokenVerify" VARCHAR(150),
    "updateDate" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createDate" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "googleTokens" JSON,
    "youtubeChannelId" TEXT,
    "youtubePlaylistId" TEXT,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "description" TEXT,
    "player" TEXT,
    "accountId" INTEGER NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_email_key" ON "account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "account_youtubeChannelId_key" ON "account"("youtubeChannelId");

-- CreateIndex
CREATE UNIQUE INDEX "account_youtubePlaylistId_key" ON "account"("youtubePlaylistId");

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
