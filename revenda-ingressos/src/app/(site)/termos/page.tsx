import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY, DraftNotice, LEGAL_UPDATED_AT } from "@/components/legal";
import { BRAND } from "@/lib/brand";
import { feeConfig } from "@/lib/money/fees";
import { PIX_EXPIRATION_MINUTES } from "@/lib/orders/service";
import { NEW_SELLER_MAX_ACTIVE_TICKETS } from "@/lib/rules/engine";
import { PLATFORMS } from "@/lib/platforms/profiles";

export const metadata: Metadata = { title: `Termos de uso — ${BRAND.name}` };

const pct = (bps: number) => `${(bps / 100).toLocaleString("pt-BR")}%`;

export default function TermsPage() {
  const fees = feeConfig();
  const rules = PLATFORMS.INGRESSE.profile;
  return (
    <main className="form-page prose" style={{ maxWidth: 820 }}>
      <h1 className="page-title">Termos de uso</h1>
      <p className="page-sub">Atualizado em {LEGAL_UPDATED_AT}.</p>
      <DraftNotice />

      <h2>1. Quem somos e o que fazemos</h2>
      <p>
        O {BRAND.name} é operado por {COMPANY.legalName}, CNPJ {COMPANY.cnpj}, com sede em {COMPANY.address}. Somos uma plataforma que aproxima pessoas que querem revender
        ingressos que compraram e pessoas que querem comprá-los. <b>Não vendemos ingressos, não somos a produtora do evento e não somos
        parceiros das ticketeiras</b> citadas. O vendedor é o responsável pelo ingresso; nós guardamos o pagamento e só o liberamos quando
        as condições destes termos forem cumpridas.
      </p>

      <h2>2. Cadastro</h2>
      <ul>
        <li>É preciso ter 18 anos ou mais e informar nome, CPF, data de nascimento, e-mail e celular verdadeiros. Cada CPF tem uma conta só.</li>
        <li>Você é responsável pela sua senha e por tudo o que for feito na sua conta.</li>
        <li>
          Para receber por vendas, o vendedor precisa de uma conta de recebimento aprovada pelo nosso parceiro de pagamentos (documento e
          selfie). Sem a aprovação, é possível anunciar até {NEW_SELLER_MAX_ACTIVE_TICKETS} ingressos, mas os valores ficam retidos até ela.
        </li>
        <li>Podemos bloquear contas com sinais de fraude, dados falsos ou descumprimento destes termos.</li>
      </ul>

      <h2>3. Anúncios</h2>
      <ul>
        <li>
          Só podem ser anunciados ingressos que o vendedor possui e que podem ser <b>transferidos pelo app oficial da ticketeira</b> (
          {Object.values(PLATFORMS).map((p) => p.name).join(", ")}). Print, PDF, foto ou QR code não são aceitos como entrega.
        </li>
        <li>
          Cada ticketeira e cada evento tem regras próprias (prazo de transferência, compra mínima de {rules.minTicketAgeDays} dias, limite
          por pessoa, necessidade de ser o comprador original). O site aplica essas regras e pode recusar ou encerrar anúncios.
        </li>
        <li>
          Em eventos esportivos, o preço não pode passar do valor de face do ingresso (Lei 14.597/2023, art. 166).
        </li>
        <li>Meia-entrada exige que o comprador tenha direito ao benefício e apresente o documento na entrada.</li>
        <li>As vendas de cada evento fecham automaticamente antes do fim da janela de transferência da ticketeira.</li>
      </ul>

      <h2>4. Compra e pagamento</h2>
      <ul>
        <li>
          O comprador paga o preço do anúncio mais a taxa de serviço de {pct(fees.buyerFeeBps)}, mostrada antes do pagamento. Cupons de
          parceiros dão desconto sobre o total.
          {fees.sellerFeeBps > 0 && ` O vendedor paga comissão de ${pct(fees.sellerFeeBps)} sobre o valor vendido.`}
        </li>
        <li>
          O pagamento é feito só por Pix, em até {PIX_EXPIRATION_MINUTES} minutos, <b>de uma conta no CPF do comprador</b>. Pix feito por
          outra pessoa é devolvido e o pedido é cancelado.
        </li>
        <li>
          O valor pago fica na conta da plataforma no Asaas (instituição de pagamento) até a liberação. Só então a parte do vendedor é
          transferida para a conta de recebimento dele.
        </li>
      </ul>

      <h2>5. Transferência e confirmação</h2>
      <ul>
        <li>
          Depois do pagamento, o vendedor recebe os dados do comprador pedidos pela ticketeira e precisa transferir o ingresso pelo app oficial
          dentro do prazo mostrado no pedido.
        </li>
        <li>Se o vendedor não transferir no prazo, o pedido é cancelado e o comprador recebe o valor total de volta.</li>
        <li>O comprador deve conferir no app da ticketeira e confirmar o recebimento no site.</li>
      </ul>

      <h2>6. Liberação ao vendedor</h2>
      <p>
        O valor é liberado ao vendedor {rules.releaseBusinessDaysAfterEvent} dias úteis depois do fim do evento, e nunca antes de{" "}
        {rules.disputeWindowHoursAfterEvent} horas depois dele, desde que não haja disputa aberta e a conta de recebimento esteja aprovada. Em seguida, o valor é enviado automaticamente por Pix
        para a chave CPF do próprio vendedor; se o CPF não estiver cadastrado como chave Pix, o valor fica guardado na conta de recebimento e
        tentamos de novo a cada 24 horas.
      </p>

      <h2>7. Disputas e reembolsos</h2>
      <ul>
        <li>
          Comprador ou vendedor podem abrir uma disputa no pedido até {rules.disputeWindowHoursAfterEvent} horas depois do fim do evento. O
          dinheiro continua retido até a decisão.
        </li>
        <li>
          Nossa equipe decide com base no histórico do pedido, no chat, nas informações das ticketeiras e nas provas enviadas. A decisão pode
          ser pela devolução ao comprador ou pela liberação ao vendedor.
        </li>
        <li>
          Reembolsos devolvem o valor total pago, taxa de serviço incluída, para a conta que fez o Pix. Eventuais tarifas do reembolso ficam
          por nossa conta.
        </li>
        <li>Se o evento for cancelado ou adiado, siga as orientações do pedido; o valor retido não é liberado ao vendedor enquanto a situação não for resolvida.</li>
      </ul>

      <h2>8. Conduta</h2>
      <ul>
        <li>É proibido combinar pagamento ou entrega fora da plataforma. Negociações por fora não têm nenhuma garantia.</li>
        <li>O chat do pedido bloqueia telefone, e-mail, links e dados de pagamento, e pode ser lido pela equipe em caso de disputa.</li>
        <li>
          É proibido anunciar ingresso falso, duplicado, já usado, cancelado ou que não seja seu, ou transferir e depois tentar recuperar o
          ingresso. Isso leva ao bloqueio da conta, à devolução ao comprador e pode ser comunicado às autoridades.
        </li>
      </ul>

      <h2>9. Parceiros</h2>
      <p>
        Agências e promoters parceiros podem ter página, link e cupom próprios e recebem parte da nossa taxa pelas vendas que indicam. Isso não
        muda o preço do vendedor nem as garantias do comprador.
      </p>

      <h2>10. Responsabilidade</h2>
      <p>
        Não respondemos pela realização, qualidade, alteração ou cancelamento do evento, que são de responsabilidade da produtora, nem pelo
        funcionamento dos apps das ticketeiras. Nossa responsabilidade é guardar o pagamento e liberá-lo ou devolvê-lo conforme estes termos.
      </p>

      <h2>11. Alterações e contato</h2>
      <p>
        Podemos atualizar estes termos; mudanças importantes serão avisadas no site ou por e-mail. Dúvidas: {COMPANY.contactEmail}. Veja também
        a <Link href="/privacidade">política de privacidade</Link> e <Link href="/como-funciona">como funciona</Link>. Fica eleito o foro do
        domicílio do consumidor.
      </p>
    </main>
  );
}
