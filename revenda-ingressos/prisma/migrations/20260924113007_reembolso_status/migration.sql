-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('NENHUM', 'SOLICITADO', 'AGUARDANDO_APROVACAO', 'CONCLUIDO', 'FALHOU');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "refundError" TEXT,
ADD COLUMN     "refundStatus" "RefundStatus" NOT NULL DEFAULT 'NENHUM',
ADD COLUMN     "refundUpdatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Order_refundStatus_idx" ON "Order"("refundStatus");
