/*
  Warnings:

  - A unique constraint covering the columns `[fromId,toId]` on the table `connectionRequest` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "connectionRequest_fromId_toId_key" ON "connectionRequest"("fromId", "toId");
