-- CreateTable
CREATE TABLE "_connections" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_connections_AB_unique" ON "_connections"("A", "B");

-- CreateIndex
CREATE INDEX "_connections_B_index" ON "_connections"("B");

-- AddForeignKey
ALTER TABLE "_connections" ADD FOREIGN KEY ("A") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_connections" ADD FOREIGN KEY ("B") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
