-- Saque automático também para agências (subconta CNPJ): a tabela de saques passa a servir aos dois.

-- AlterTable
ALTER TABLE "Partner" ADD COLUMN     "cnpj" TEXT,
ADD COLUMN     "gatewayAccountId" TEXT,
ADD COLUMN     "gatewayAccountStatus" "GatewayAccountStatus" NOT NULL DEFAULT 'NENHUM',
ADD COLUMN     "gatewayApiKeyEnc" TEXT,
ADD COLUMN     "payoutEmail" TEXT,
ADD COLUMN     "withdrawalDueAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Partner_gatewayAccountId_key" ON "Partner"("gatewayAccountId");

-- SellerWithdrawal -> Withdrawal (mantém os registros)
ALTER TABLE "SellerWithdrawal" DROP CONSTRAINT "SellerWithdrawal_userId_fkey";
ALTER TABLE "SellerWithdrawal" RENAME TO "Withdrawal";
ALTER TABLE "Withdrawal" RENAME CONSTRAINT "SellerWithdrawal_pkey" TO "Withdrawal_pkey";
ALTER INDEX "SellerWithdrawal_userId_status_idx" RENAME TO "Withdrawal_userId_status_idx";
ALTER TABLE "Withdrawal" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "Withdrawal" ADD COLUMN "partnerId" TEXT;
ALTER TABLE "Withdrawal" ADD COLUMN "pixKeyType" TEXT NOT NULL DEFAULT 'CPF';
ALTER TABLE "Withdrawal" ALTER COLUMN "pixKeyType" DROP DEFAULT;

CREATE INDEX "Withdrawal_partnerId_status_idx" ON "Withdrawal"("partnerId", "status");

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
