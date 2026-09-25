import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY, DraftNotice, LEGAL_UPDATED_AT } from "@/components/legal";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: `Política de privacidade — ${BRAND.name}` };

export default function PrivacyPage() {
  return (
    <main className="form-page prose" style={{ maxWidth: 820 }}>
      <h1 className="page-title">Política de privacidade</h1>
      <p className="page-sub">Atualizada em {LEGAL_UPDATED_AT}. Como tratamos seus dados, conforme a LGPD (Lei 13.709/2018).</p>
      <DraftNotice />

      <h2>1. Controlador</h2>
      <p>
        {COMPANY.legalName}, CNPJ {COMPANY.cnpj}, {COMPANY.address}, responsável pelo {BRAND.name}. Encarregado de dados: {COMPANY.privacyEmail}.
      </p>

      <h2>2. Dados que coletamos e para quê</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Dado</th>
            <th>Para quê</th>
            <th>Base legal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Nome, CPF, data de nascimento, e-mail, celular, senha (guardada só como código irreversível)</td>
            <td>Criar a conta, confirmar maioridade, evitar contas duplicadas e fraude, falar com você sobre os pedidos</td>
            <td>Execução de contrato; prevenção à fraude</td>
          </tr>
          <tr>
            <td>CPF de quem fez o Pix (mascarado pelo banco)</td>
            <td>Conferir que o pagamento saiu da conta do próprio comprador</td>
            <td>Prevenção à fraude</td>
          </tr>
          <tr>
            <td>Dados pedidos pela ticketeira para a transferência (e-mail, CPF, nome ou ID do app)</td>
            <td>Mostrados ao vendedor <b>só depois do pagamento</b>, para ele transferir o ingresso</td>
            <td>Execução de contrato</td>
          </tr>
          <tr>
            <td>Documento, selfie e dados bancários do vendedor</td>
            <td>Aprovar a conta de recebimento. Enviados e analisados diretamente pelo nosso parceiro de pagamentos</td>
            <td>Obrigação legal; prevenção à fraude</td>
          </tr>
          <tr>
            <td>Anúncios, pedidos, mensagens do chat e histórico</td>
            <td>Operar a revenda, resolver disputas e cumprir obrigações fiscais</td>
            <td>Execução de contrato; exercício regular de direitos</td>
          </tr>
          <tr>
            <td>Celular para WhatsApp</td>
            <td>Avisos dos pedidos, só se você aceitar (pode desligar em Minha conta)</td>
            <td>Consentimento</td>
          </tr>
        </tbody>
      </table>

      <h2>3. Com quem compartilhamos</h2>
      <ul>
        <li><b>Asaas</b> (instituição de pagamento): cobrança Pix, custódia, repasses, reembolsos e verificação do vendedor.</li>
        <li><b>Outra parte do pedido:</b> o vendedor vê seu primeiro nome e os dados de transferência; o comprador vê o primeiro nome do vendedor.</li>
        <li><b>Fornecedores de tecnologia:</b> hospedagem e banco de dados, envio de e-mails e, se você aceitar, WhatsApp (Meta).</li>
        <li><b>Parceiros:</b> a agência que indicou a venda vê o evento, o valor e a comissão, sem seus dados pessoais.</li>
        <li><b>Autoridades:</b> quando houver obrigação legal ou ordem judicial, ou para apurar fraude.</li>
      </ul>
      <p>Não vendemos seus dados e não usamos rastreadores de publicidade.</p>

      <h2>4. Cookies</h2>
      <p>
        Usamos só cookies necessários: <b>sessao</b> (mantém você conectado) e <b>parceiro</b> (lembra por 30 dias qual agência indicou você,
        para o cupom e a comissão).
      </p>

      <h2>5. Por quanto tempo guardamos</h2>
      <p>
        Enquanto a conta estiver ativa. Depois de encerrada, mantemos pedidos, pagamentos e mensagens pelo prazo exigido por lei (fiscal e de
        prevenção à lavagem de dinheiro, em geral 5 anos) ou enquanto houver disputa ou processo.
      </p>

      <h2>6. Seus direitos</h2>
      <p>
        Você pode pedir confirmação e acesso aos seus dados, correção, portabilidade, informação sobre compartilhamento, revogação do
        consentimento e exclusão do que não precisarmos guardar por lei. Escreva para {COMPANY.privacyEmail}. Você também pode reclamar à
        ANPD.
      </p>

      <h2>7. Segurança</h2>
      <p>
        Senhas com hash, sessões com token guardado só em forma de hash, chaves de pagamento criptografadas, conexão HTTPS e acesso restrito à
        equipe. Nenhum sistema é infalível: se houver incidente relevante, avisaremos você e a ANPD.
      </p>

      <p style={{ marginTop: 32 }}>
        Veja também os <Link href="/termos">termos de uso</Link>.
      </p>
    </main>
  );
}
