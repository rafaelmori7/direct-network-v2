-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('NENHUM', 'SOLICITADO', 'CONCLUIDO', 'FALHOU');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "payoutError" TEXT,
ADD COLUMN     "payoutStatus" "PayoutStatus" NOT NULL DEFAULT 'NENHUM',
ADD COLUMN     "payoutUpdatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Order_payoutStatus_idx" ON "Order"("payoutStatus");
