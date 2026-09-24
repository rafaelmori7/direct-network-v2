-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('ENVIADO', 'REGISTRADO', 'FALHOU');

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "orderId" TEXT,
    "status" "EmailStatus" NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailLog_orderId_kind_to_idx" ON "EmailLog"("orderId", "kind", "to");
