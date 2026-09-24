export {};

// Marca um usuário como verificado (pode vender). Uso: npm run admin:verificar -- email@exemplo.com
// Provisório até a verificação de documento/selfie ou a aprovação da subconta no gateway.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const email = process.argv[2]?.toLowerCase();
if (!email) {
  console.error("Informe o e-mail.");
  process.exit(1);
}
prisma.user
  .update({ where: { email }, data: { verifiedAt: new Date() } })
  .then((u) => console.log(`${u.name} verificado.`))
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
