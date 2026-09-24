import type { PlatformCode, RuleProfile } from "@/lib/rules/types";

// Perfis iniciais, conservadores. Valores marcados "a confirmar" não foram
// encontrados em fonte pública: testar com uma transferência real antes de
// abrir a ticketeira para o público.

const BASE = {
  listingEnabled: true,
  sellerTransferDeadlineHours: 24,
  minTicketAgeDays: 8,
  releaseBusinessDaysAfterEvent: 3,
  disputeWindowHoursAfterEvent: 48,
  priceCapMode: "LIVRE",
  maxMarkupPercent: 0,
  maxTicketsPerSellerPerEvent: 10,
} satisfies Partial<RuleProfile>;

export const PLATFORMS: Record<PlatformCode, { name: string; profile: RuleProfile }> = {
  INGRESSE: {
    name: "Ingresse",
    profile: {
      ...BASE,
      transferInstructions:
        "No app Ingresse: Carteira > selecione o ingresso > Transferir ingresso > informe o e-mail da conta Ingresse do comprador.",
      buyerIdentifiers: ["EMAIL"],
      sellerMustBeOriginalBuyer: false, // a confirmar
      transferOpensDaysBefore: null,
      transferLockHoursBefore: 24, // a confirmar: depende do produtor
      resaleRisk: "BAIXO",
      receiptChecklist: [
        "O ingresso aparece na minha carteira do app Ingresse",
        "O ingresso está no meu nome/e-mail e não aparece como pendente",
      ],
    },
  },
  SYMPLA: {
    name: "Sympla",
    profile: {
      ...BASE,
      transferInstructions:
        "No app Sympla: Opções > Editar participantes > ícone ao lado do ingresso > preencha nome, CPF e e-mail do comprador. A Sympla permite só UMA troca por ingresso.",
      buyerIdentifiers: ["NOME_COMPLETO", "CPF", "EMAIL"],
      sellerMustBeOriginalBuyer: true, // só uma troca de titularidade por ingresso
      transferOpensDaysBefore: null,
      transferLockHoursBefore: 24, // troca desabilitada 24h antes do evento
      resaleRisk: "BAIXO",
      receiptChecklist: [
        "Recebi o e-mail da Sympla com o ingresso no meu nome",
        "O ingresso aparece no app Sympla com meu nome e CPF",
      ],
    },
  },
  TICKETMASTER: {
    name: "Ticketmaster (Quentro)",
    profile: {
      ...BASE,
      transferInstructions:
        "No app Quentro: aba Próximos > selecione o ingresso > Transferir > informe o e-mail ou Quentro ID do comprador. O comprador precisa já ter conta no Quentro.",
      buyerIdentifiers: ["EMAIL", "QUENTRO_ID"],
      sellerMustBeOriginalBuyer: true, // quem recebe no Quentro não pode transferir de novo
      transferOpensDaysBefore: 30, // padrão Ticketmaster; eventos podem sobrescrever
      transferLockHoursBefore: 7 * 24,
      resaleRisk: "MEDIO", // termos: transferência "para amigos e família"
      receiptChecklist: [
        "O ingresso aparece no MEU app Quentro, na aba Próximos",
        "A transferência está ACEITA (não aparece como Pendente)",
        "Ingresso ativado, quando o evento exigir (ex.: Rock in Rio)",
      ],
    },
  },
};
