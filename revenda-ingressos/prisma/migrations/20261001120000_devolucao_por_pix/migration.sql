-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "refundByPix" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "refundTransferId" TEXT;
