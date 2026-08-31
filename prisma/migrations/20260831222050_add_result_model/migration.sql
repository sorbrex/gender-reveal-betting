-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "winningGender" "Gender",
    "isRevealed" BOOLEAN NOT NULL DEFAULT false,
    "bettingClosed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);
