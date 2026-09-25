import type { Metadata } from "next";
import Link from "next/link";
import { ShieldIcon } from "@/components/chrome";
import { BRAND } from "@/lib/brand";
import { feeConfig } from "@/lib/money/fees";
import { PLATFORMS } from "@/lib/platforms/profiles";

export const metadata: Metadata = { title: `Como funciona — ${BRAND.name}` };

const pct = (bps: number) => `${(bps / 100).toLocaleString("pt-BR")}%`;

export default function HowItWorks() {
  const fees = feeConfig();
  const rules = PLATFORMS.INGRESSE.profile;
  return (
    <main className="form-page prose" style={{ maxWidth: 820 }}>
      <h1 className="page-title">Como funciona</h1>
      <p className="page-sub">
        Revenda entre pessoas com duas travas: o ingresso passa <b>pelo app oficial da ticketeira</b> e o dinheiro fica{" "}
        <b>retido até o fim do evento</b>. Ninguém precisa confiar em print, PDF ou conversa de grupo.
      </p>

      <div className="how-steps">
        <div className="aside-card">
          <div className="aside-head">Para quem compra</div>
          <ol className="steps">
            <li>
              <span>Escolha o ingresso e pague com <b>Pix da sua própria conta</b> (o CPF do Pix precisa ser o do seu cadastro).</span>
            </li>
            <li>
              <span>O dinheiro fica retido. O vendedor recebe seus dados e transfere o ingresso pelo app oficial dentro do prazo mostrado no pedido.</span>
            </li>
            <li>
              <span>Abra o app da ticketeira, aceite a transferência e confirme no site que o ingresso está na sua conta.</span>
            </li>
            <li>
              <span>Vá ao evento. Se algo der errado na entrada, abra uma disputa em até {rules.disputeWindowHoursAfterEvent}h depois do fim do evento.</span>
            </li>
          </ol>
        </div>
        <div className="aside-card">
          <div className="aside-head">Para quem vende</div>
          <ol className="steps">
            <li>
              <span>Crie sua conta de recebimento e anuncie na hora (até 10 ingressos enquanto os documentos são analisados).</span>
            </li>
            <li>
              <span>Quando vender, você é avisado por e-mail (e WhatsApp, se quiser) com os dados do comprador.</span>
            </li>
            <li>
              <span>Transfira pelo app oficial dentro do prazo e clique em &quot;Já transferi&quot;.</span>
            </li>
            <li>
              <span>
              Receba na sua conta {rules.releaseBusinessDaysAfterEvent} dias úteis depois do evento, se não houver disputa. Os pagamentos só são liberados
              com o cadastro aprovado.
            </span>
            </li>
          </ol>
        </div>
      </div>

      <h2 className="section-title">O que protege você</h2>
      <ul className="checks">
        <li><ShieldIcon size={16} /> Só aceitamos ingresso transferível pelo app oficial ({Object.values(PLATFORMS).map((p) => p.name).join(", ")}).</li>
        <li><ShieldIcon size={16} /> O vendedor só recebe depois do evento. Se não transferir no prazo, o comprador recebe tudo de volta automaticamente.</li>
        <li><ShieldIcon size={16} /> Pagamento só por Pix, do CPF do comprador: sem cartão, sem chargeback, sem golpe de conta de terceiro.</li>
        <li><ShieldIcon size={16} /> Chat dentro do pedido. Telefone, e-mail e links são bloqueados para ninguém levar a negociação para fora.</li>
        <li><ShieldIcon size={16} /> Vendedores com documento e selfie verificados antes de receber.</li>
        <li><ShieldIcon size={16} /> A venda fecha antes do fim da janela de transferência de cada evento.</li>
      </ul>

      <h2 className="section-title">Quanto custa</h2>
      <p>
        Quem compra paga o preço do anúncio + <b>{pct(fees.buyerFeeBps)} de taxa de serviço</b>, mostrada antes do pagamento.
        {fees.sellerFeeBps > 0 ? ` Quem vende paga ${pct(fees.sellerFeeBps)} sobre o valor vendido.` : " Anunciar e vender não custa nada."} Com o
        cupom de uma agência parceira, o desconto vale sobre o total.
      </p>

      <h2 className="section-title">Perguntas frequentes</h2>
      <details className="faq">
        <summary>E se o vendedor não transferir?</summary>
        <p>O pedido é cancelado quando o prazo acaba e devolvemos o valor total, taxa incluída, para a conta que fez o Pix.</p>
      </details>
      <details className="faq">
        <summary>Posso mandar print ou PDF do ingresso?</summary>
        <p>Não. Só vale a transferência pelo app oficial: é a única forma de o ingresso antigo deixar de funcionar.</p>
      </details>
      <details className="faq">
        <summary>Por que meu Pix foi devolvido?</summary>
        <p>O Pix precisa sair de uma conta no CPF do seu cadastro. Pagamentos de terceiros são devolvidos por segurança.</p>
      </details>
      <details className="faq">
        <summary>Quando o vendedor recebe?</summary>
        <p>
          {rules.releaseBusinessDaysAfterEvent} dias úteis depois do fim do evento (e nunca antes de {rules.disputeWindowHoursAfterEvent}h), se
          não houver disputa aberta.
        </p>
      </details>
      <details className="faq">
        <summary>O evento foi cancelado. E agora?</summary>
        <p>Abra uma disputa no pedido. A equipe analisa e, se o evento não acontecer, o comprador é reembolsado.</p>
      </details>

      <p style={{ marginTop: 32 }}>
        <Link href="/" className="btn btn-primary">
          Ver ingressos
        </Link>{" "}
        <Link href="/anunciar" className="btn btn-outline">
          Vender meu ingresso
        </Link>
      </p>
    </main>
  );
}
