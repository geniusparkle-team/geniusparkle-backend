-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'unknow');

-- CreateTable
CREATE TABLE "account" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" VARCHAR(45) NOT NULL,
    "password" VARCHAR(150) NOT NULL,
    "birthday" VARCHAR(45),
    "age" INTEGER,
    "gender" "Gender" DEFAULT E'unknow',
    "status" VARCHAR(45) NOT NULL DEFAULT E'acticve',
    "verify" BOOLEAN NOT NULL DEFAULT false,
    "tokenVerify" VARCHAR(150),
    "otherData" VARCHAR(150),
    "createDate" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDate" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accRole" VARCHAR(45) NOT NULL DEFAULT E'user',
    "note" TEXT,
    "googleRefreshToken" TEXT,
    "googleAccessToken" TEXT,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_email_key" ON "account"("email");
