import { PLATFORMS } from "@/lib/platforms/profiles";

const STEPS = [
  "Você paga por Pix e o dinheiro fica retido: o vendedor ainda não recebe.",
  "O vendedor transfere o ingresso pelo app oficial da ticketeira. PDF e print não valem.",
  "Você confere o ingresso na sua carteira do app oficial e confirma.",
  "Depois do evento, sem reclamação, o pagamento é liberado ao vendedor.",
  "Se o vendedor não transferir no prazo, ou o ingresso for cancelado, você recebe o dinheiro de volta.",
];

export default function Home() {
  return (
    <main>
      <h1>Revenda de ingressos com garantia</h1>
      <p className="lead">A agilidade do grupo de compra e venda, sem o risco de golpe.</p>

      <h2>Como funciona</h2>
      <ol className="steps">
        {STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <h2>Ticketeiras aceitas</h2>
      <div className="cards">
        {Object.entries(PLATFORMS).map(([code, { name, profile }]) => (
          <section className="card" key={code}>
            <h3>{name}</h3>
            <dl>
              <dt>Transferência</dt>
              <dd>{profile.transferInstructions}</dd>
              <dt>Quem vende</dt>
              <dd>{profile.sellerMustBeOriginalBuyer ? "Só o comprador original" : "Titular da carteira"}</dd>
              <dt>Prazo p/ transferir</dt>
              <dd>{profile.sellerTransferDeadlineHours}h após o pagamento</dd>
              <dt>Liberação</dt>
              <dd className="badge">{profile.releaseBusinessDaysAfterEvent} dias úteis após o evento</dd>
            </dl>
          </section>
        ))}
      </div>
    </main>
  );
}
