-- CreateEnum
CREATE TYPE "GatewayAccountStatus" AS ENUM ('NENHUM', 'EM_ANALISE', 'APROVADA', 'REPROVADA');

-- AlterEnum
ALTER TYPE "PayoutStatus" ADD VALUE 'AGUARDANDO_CADASTRO';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "gatewayAccountStatus" "GatewayAccountStatus" NOT NULL DEFAULT 'NENHUM',
ADD COLUMN     "gatewayApiKeyEnc" TEXT,
ADD COLUMN     "gatewayOnboardingUrl" TEXT;
