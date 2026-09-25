-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('SOLICITADO', 'AGUARDANDO_APROVACAO', 'CONCLUIDO', 'FALHOU');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "withdrawalDueAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SellerWithdrawal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cents" INTEGER NOT NULL,
    "pixKey" TEXT NOT NULL,
    "transferId" TEXT,
    "status" "WithdrawalStatus" NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerWithdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SellerWithdrawal_userId_status_idx" ON "SellerWithdrawal"("userId", "status");

-- AddForeignKey
ALTER TABLE "SellerWithdrawal" ADD CONSTRAINT "SellerWithdrawal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
