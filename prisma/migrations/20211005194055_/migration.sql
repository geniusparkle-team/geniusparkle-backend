-- CreateTable
CREATE TABLE "connectionRequest" (
    "id" TEXT NOT NULL,
    "fromId" INTEGER NOT NULL,
    "toId" INTEGER NOT NULL,

    CONSTRAINT "connectionRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "connectionRequest" ADD CONSTRAINT "connectionRequest_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connectionRequest" ADD CONSTRAINT "connectionRequest_toId_fkey" FOREIGN KEY ("toId") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
