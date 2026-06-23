'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const SPACE_ID = 'jlayhg56ixnc';
const ACCESS_TOKEN = 'LlltVYQHPrduF1DBWcyJRRuGws0YpaenPH9ljMSm7F0';

async function getCortesia(slug) {
  const url = `https://cdn.contentful.com/spaces/${SPACE_ID}/entries?content_type=cortesia&fields.slug=${slug}&include=1`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
  });
  const data = await res.json();
  if (!data.items || data.items.length === 0) return null;

  const item = data.items[0].fields;
  const assets = data.includes?.Asset || [];

  let imagemUrl = null;
  if (item.imagem) {
    const assetId = item.imagem.sys.id;
    const asset = assets.find(a => a.sys.id === assetId);
    if (asset) imagemUrl = 'https:' + asset.fields.file.url;
  }

  return {
    nome: item.nome || '',
    data: item.data || '',
    horario: item.horrio || '',
    local: item.local || '',
    endereco: item.endereo || '',
    imagemUrl,
    linkCortesia: item.linkCortesia || '',
    appsScriptUrl: item.appsScriptUrl || '',
    ativo: item.ativo !== false, // default true se não definido
    mensagemEncerrada: item.mensagemEncerrada || 'As cortesias para este evento foram encerradas.',
    linkWhatsApp: item.linkWhatsApp || '',
  };
}

export default function CortesiaPage() {
  const params = useParams();
  const slug = params?.slug;

  const [evento, setEvento] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | not-found | ready
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [resgatado, setResgatado] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!slug) return;
    getCortesia(slug).then(data => {
      if (!data) setStatus('not-found');
      else { setEvento(data); setStatus('ready'); }
    });
  }, [slug]);

  function validarEmail(e) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  }

  async function handleSubmit() {
    setErro('');
    if (!validarEmail(email)) {
      setErro('E-mail inválido. Verifique e tente novamente.');
      return;
    }
    setLoading(true);
    try {
      await fetch(evento.appsScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          evento: evento.nome,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (_) {}
    setLoading(false);
    setResgatado(true);
  }

  function copiarLink() {
    navigator.clipboard.writeText(evento.linkCortesia).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  // ── Loading ──
  if (status === 'loading') {
    return (
      <main style={styles.main}>
        <p style={{ color: '#888', fontSize: 14 }}>Carregando...</p>
      </main>
    );
  }

  // ── Not found ──
  if (status === 'not-found') {
    return (
      <main style={styles.main}>
        <div style={styles.card}>
          <p style={{ color: '#888', fontSize: 15, textAlign: 'center' }}>
            Cortesia não encontrada.
          </p>
        </div>
      </main>
    );
  }

  // ── Encerrada ──
  if (!evento.ativo) {
    return (
      <main style={styles.main}>
        <div style={{ marginBottom: 32 }}>
          <img src="/logo.png" alt="Direct Network" style={{ height: 36, objectFit: 'contain' }} />
        </div>
        <div style={styles.card}>
          {evento.imagemUrl && (
            <div style={styles.bannerWrap}>
              <img src={evento.imagemUrl} alt={evento.nome} style={styles.bannerImg} />
              <div style={styles.bannerGradient} />
            </div>
          )}
          <div style={{ padding: '24px 28px 32px', display: 'flex', flexDirection: 'column', gap: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 32 }}>😔</div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f0f0f0', marginBottom: 8 }}>
                Cortesias encerradas
              </h2>
              <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6 }}>
                {evento.mensagemEncerrada}
              </p>
            </div>
            {evento.linkWhatsApp && (
              <a href={evento.linkWhatsApp} target="_blank" rel="noopener noreferrer" style={styles.btnPrimary}>
                Entrar no grupo do WhatsApp
              </a>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ── Ativa ──
  return (
    <main style={styles.main}>
      <div style={{ marginBottom: 32 }}>
        <img src="/logo.png" alt="Direct Network" style={{ height: 36, objectFit: 'contain' }} />
      </div>

      <div style={styles.card}>
        {evento.imagemUrl && (
          <div style={styles.bannerWrap}>
            <img src={evento.imagemUrl} alt={evento.nome} style={styles.bannerImg} />
            <div style={styles.bannerGradient} />
          </div>
        )}

        <div style={{ padding: '24px 28px 32px' }}>
          <div style={{ marginBottom: 28 }}>
            <span style={styles.badge}>Cortesia</span>
            <h1 style={styles.h1}>{evento.nome}</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
              {evento.data && <InfoRow icon="📅" texto={evento.data} />}
              {evento.horario && <InfoRow icon="🕐" texto={evento.horario} />}
              {(evento.local || evento.endereco) && (
                <InfoRow icon="📍" texto={[evento.local, evento.endereco].filter(Boolean).join(' · ')} />
              )}
            </div>
          </div>

          <div style={{ height: 1, background: '#242424', marginBottom: 28 }} />

          {!resgatado ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: 14, color: '#aaa', lineHeight: 1.55 }}>
                Informe seu e-mail para liberar o link do ingresso gratuito.
              </p>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#ccc', marginBottom: 8 }}>
                  Seu e-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="voce@email.com"
                  style={{ ...styles.input, borderColor: erro ? '#ff6b6b' : '#242424' }}
                />
                {erro && <p style={{ fontSize: 12, color: '#ff6b6b', marginTop: 6 }}>{erro}</p>}
              </div>
              <button onClick={handleSubmit} disabled={loading} style={{ ...styles.btnPrimary, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Aguarde...' : 'Liberar meu ingresso'}
              </button>
              <p style={{ fontSize: 11, color: '#444', textAlign: 'center' }}>
                Seus dados são usados apenas para controle de acesso.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, textAlign: 'center' }}>
              <div style={styles.checkIcon}>🎟️</div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f0f0f0', marginBottom: 6 }}>
                  Ingresso liberado!
                </h2>
                <p style={{ fontSize: 14, color: '#888', lineHeight: 1.55 }}>
                  Acesse o link abaixo para retirar sua cortesia.
                </p>
              </div>
              <div style={styles.linkBox}>{evento.linkCortesia}</div>
              <a href={evento.linkCortesia} target="_blank" rel="noopener noreferrer" style={styles.btnPrimary}>
                Retirar ingresso →
              </a>
              <button onClick={copiarLink} style={styles.btnSecondary}>
                {copiado ? '✓ Copiado!' : 'Copiar link'}
              </button>
              <p style={{ fontSize: 11, color: '#444' }}>
                Guarde o link — ele é seu ingresso para {evento.nome}.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function InfoRow({ icon, texto }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <span style={{ fontSize: 13 }}>{icon}</span>
      <span style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>{texto}</span>
    </div>
  );
}

const styles = {
  main: {
    minHeight: '100vh',
    background: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 16px 64px',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    background: '#141414',
    border: '1px solid #242424',
    borderRadius: 20,
    overflow: 'hidden',
  },
  bannerWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: '1 / 1',
    background: '#1a1a1a',
  },
  bannerImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  bannerGradient: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to bottom, transparent 50%, #141414 100%)',
  },
  badge: {
    display: 'inline-block',
    background: 'rgba(255,45,120,.12)',
    border: '1px solid rgba(255,45,120,.25)',
    borderRadius: 999,
    padding: '3px 12px',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '.06em',
    textTransform: 'uppercase',
    color: '#ff2d78',
    marginBottom: 12,
  },
  h1: {
    fontSize: 26,
    fontWeight: 800,
    color: '#f0f0f0',
    lineHeight: 1.2,
  },
  input: {
    width: '100%',
    background: '#0a0a0a',
    border: '1px solid #242424',
    borderRadius: 12,
    color: '#f0f0f0',
    fontSize: 15,
    padding: '13px 16px',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  btnPrimary: {
    background: '#ff2d78',
    border: 'none',
    borderRadius: 12,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: 600,
    padding: '15px',
    width: '100%',
    fontFamily: 'inherit',
    textDecoration: 'none',
    textAlign: 'center',
    display: 'block',
  },
  btnSecondary: {
    background: 'transparent',
    border: '1px solid #242424',
    borderRadius: 12,
    color: '#f0f0f0',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    padding: '13px',
    width: '100%',
    fontFamily: 'inherit',
  },
  linkBox: {
    background: '#0a0a0a',
    border: '1px solid #242424',
    borderRadius: 12,
    padding: '14px 16px',
    fontSize: 13,
    color: '#ff2d78',
    wordBreak: 'break-all',
    textAlign: 'left',
    lineHeight: 1.5,
  },
  checkIcon: {
    width: 56,
    height: 56,
    background: 'rgba(255,45,120,.12)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 26,
    margin: '0 auto',
  },
};
