-- CreateTable
CREATE TABLE "RefreshToken" (
    "token" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires" TIMESTAMPTZ,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("token")
);

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
