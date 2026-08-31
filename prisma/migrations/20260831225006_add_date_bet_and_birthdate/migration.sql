-- AlterTable
ALTER TABLE "Result" ADD COLUMN     "birthDate" DATE;

-- CreateTable
CREATE TABLE "DateBet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DateBet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DateBet_userId_key" ON "DateBet"("userId");

-- AddForeignKey
ALTER TABLE "DateBet" ADD CONSTRAINT "DateBet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
