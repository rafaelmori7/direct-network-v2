-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "partnerId" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "discountCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "partnerAttribution" TEXT,
ADD COLUMN     "partnerFeeCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "partnerId" TEXT;

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "couponCode" TEXT NOT NULL,
    "logoUrl" TEXT,
    "color" TEXT NOT NULL DEFAULT '#5b2ee6',
    "commissionShareBps" INTEGER NOT NULL DEFAULT 5000,
    "discountBps" INTEGER NOT NULL DEFAULT 0,
    "gatewayWalletId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Partner_slug_key" ON "Partner"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_couponCode_key" ON "Partner"("couponCode");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
