export type PlatformCode = "INGRESSE" | "SYMPLA" | "TICKETMASTER";

/** Dado que o comprador precisa informar para o vendedor conseguir transferir. */
export type BuyerIdentifier = "EMAIL" | "CPF" | "NOME_COMPLETO" | "QUENTRO_ID";

export type PriceCapMode = "LIVRE" | "VALOR_DE_FACE" | "PERCENTUAL";

export type ResaleRisk = "BAIXO" | "MEDIO" | "ALTO";

export type TicketType = "INTEIRA" | "MEIA" | "MEIA_SOCIAL" | "CORTESIA";

export type TransferAllowed = "SIM" | "NAO" | "DESCONHECIDO";

/**
 * Perfil de regras de uma ticketeira. Cada evento herda o perfil da sua
 * ticketeira e pode sobrescrever qualquer campo em `EventRuleInput.overrides`.
 */
export interface RuleProfile {
  /** Liga/desliga anúncios para a ticketeira ou evento inteiro. */
  listingEnabled: boolean;
  /** Texto curto mostrado ao vendedor: onde e como transferir. */
  transferInstructions: string;
  buyerIdentifiers: BuyerIdentifier[];
  /** Quentro e Sympla não permitem transferir de novo um ingresso recebido. */
  sellerMustBeOriginalBuyer: boolean;
  /** A transferência só abre X dias antes do evento (null = a qualquer momento). */
  transferOpensDaysBefore: number | null;
  /** A ticketeira bloqueia transferências X horas antes do início. */
  transferLockHoursBefore: number;
  /** Prazo para o vendedor transferir depois do pagamento confirmado. */
  sellerTransferDeadlineHours: number;
  /**
   * Idade mínima do ingresso. O comprador original pode cancelar em 7 dias
   * (CDC art. 49) mesmo depois de transferir.
   */
  minTicketAgeDays: number;
  /** Dias úteis depois do fim do evento para liberar o pagamento ao vendedor. */
  releaseBusinessDaysAfterEvent: number;
  /** Horas depois do fim do evento em que o comprador ainda pode abrir disputa. */
  disputeWindowHoursAfterEvent: number;
  priceCapMode: PriceCapMode;
  /** Usado quando `priceCapMode` é PERCENTUAL: 20 = até 20% acima do valor de face. */
  maxMarkupPercent: number;
  maxTicketsPerSellerPerEvent: number;
  resaleRisk: ResaleRisk;
  /** O que o comprador confirma antes de clicar em "recebi". */
  receiptChecklist: string[];
}

export interface EventRuleInput {
  startsAt: Date;
  endsAt: Date;
  /** Evento esportivo: revenda acima do valor de face é crime (Lei 14.597/2023, art. 166). */
  isSports: boolean;
  transferAllowed: TransferAllowed;
  /** Ingresso nominal com biometria/reconhecimento facial: não dá para revender. */
  nominalBiometric: boolean;
  /** Data/hora exata em que a ticketeira abre a transferência neste evento. */
  transferOpensAt?: Date | null;
  /** Data/hora exata em que a ticketeira encerra a transferência neste evento. */
  transferEndsAt?: Date | null;
  overrides: Partial<RuleProfile>;
}
