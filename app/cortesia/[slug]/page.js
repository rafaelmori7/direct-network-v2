'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const SPACE_ID = 'jlayhg56ixnc';
const ACCESS_TOKEN = 'LlltVYQHPrduF1DBWcyJRRuGws0YpaenPH9ljMSm7F0';
const LINK_GRUPO = 'https://curt.link/grupo-direct';

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
    linkCortesiaMasc: item.linkCortesiaMasc || '',
    appsScriptUrlMasc: item.appsScriptUrlMasc || '',
    ativo: item.ativo !== false,
    mensagemEncerrada: item.mensagemEncerrada || 'As cortesias para este evento foram encerradas.',
    linkWhatsApp: item.linkWhatsApp || '',
  };
}

export default function CortesiaPage() {
  const params = useParams();
  const slug = params?.slug;

  const [evento, setEvento] = useState(null);
  const [status, setStatus] = useState('loading');
  const [genero, setGenero] = useState(null);
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

  const temGenero = evento && evento.appsScriptUrlMasc && evento.linkCortesiaMasc;
  const scriptUrl = genero === 'masc' ? evento?.appsScriptUrlMasc : evento?.appsScriptUrl;
  const linkCortesia = genero === 'masc' ? evento?.linkCortesiaMasc : evento?.linkCortesia;

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
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: '',
          email: email.trim(),
          evento: evento.nome,
          genero: genero === 'masc' ? 'Masculino' : 'Feminino',
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (_) {}
    setLoading(false);
    setResgatado(true);
  }

  function copiarLink() {
    navigator.clipboard.writeText(linkCortesia).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  if (status === 'loading') {
    return <main style={styles.main}><p style={{ color: '#888', fontSize: 14 }}>Carregando...</p></main>;
  }

  if (status === 'not-found') {
    return (
      <main style={styles.main}>
        <div style={styles.card}>
          <p style={{ color: '#888', fontSize: 15, textAlign: 'center', padding: 32 }}>Cortesia não encontrada.</p>
        </div>
      </main>
    );
  }

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
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f0f0f0', marginBottom: 8 }}>Cortesias encerradas</h2>
              <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6 }}>{evento.mensagemEncerrada}</p>
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
            <span style={styles.badge}>🎟️ Garanta sua cortesia</span>
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

          {/* SELEÇÃO DE GÊNERO */}
          {temGenero && !genero && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: 14, color: '#ddd', lineHeight: 1.55, textAlign: 'center' }}>
                Qual cortesia você gostaria de gerar?
              </p>
              <button onClick={() => setGenero('masc')} style={styles.btnGenero}>👨 Masculino</button>
              <button onClick={() => setGenero('fem')} style={styles.btnGenero}>👩 Feminino</button>
            </div>
          )}

          {/* FORMULÁRIO */}
          {(!temGenero || genero) && !resgatado && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {temGenero && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => setGenero(null)} style={styles.btnVoltar}>← Voltar</button>
                  <span style={{ fontSize: 13, color: '#888' }}>
                    Lista {genero === 'masc' ? 'Masculino' : 'Feminino'}
                  </span>
                </div>
              )}
              <p style={{ fontSize: 14, color: '#ddd', lineHeight: 1.55 }}>
                1. Informe seu e-mail para receber o link para gerar a cortesia.
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
                {loading ? 'Aguarde...' : 'Enviar'}
              </button>
              <p style={{ fontSize: 11, color: '#444', textAlign: 'center' }}>
                Seus dados são usados apenas para controle de acesso.
              </p>
            </div>
          )}

          {/* LINK LIBERADO */}
          {resgatado && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center' }}>
              <div style={styles.checkIcon}>🎟️</div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f0f0f0', marginBottom: 12 }}>
                  Cortesia liberada! 🎉
                </h2>
                <p style={{ fontSize: 14, color: '#ddd', lineHeight: 1.7, textAlign: 'left' }}>
                  Agora siga os passos:<br /><br />
                  <strong style={{ color: '#fff' }}>1.</strong> Clique no botão abaixo<br />
                  <strong style={{ color: '#fff' }}>2.</strong> Você será direcionado para a página para gerar a sua cortesia.
                </p>
              </div>
              <div style={styles.linkBox}>{linkCortesia}</div>
              <a href={linkCortesia} target="_blank" rel="noopener noreferrer" style={styles.btnPrimary}>
                Clique aqui para gerar sua cortesia →
              </a>
              <button onClick={copiarLink} style={styles.btnSecondary}>
                {copiado ? '✓ Copiado!' : 'Copiar link'}
              </button>

              {/* DIVISOR */}
              <div style={{ height: 1, background: '#242424', margin: '4px 0' }} />

              {/* GRUPO WHATSAPP — discreto, abaixo de tudo */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ fontSize: 12, color: '#555', textAlign: 'center' }}>
                  Quer receber mais eventos e benefícios exclusivos?
                </p>
                <a href={LINK_GRUPO} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 12, border: '1px solid #25D366', color: '#25D366', fontSize: 13, fontWeight: 600, textDecoration: 'none', background: 'transparent' }}>
                  Entrar no grupo WhatsApp
                </a>
              </div>

              <p style={{ fontSize: 11, color: '#444' }}>
                Guarde o link — ele é sua cortesia para {evento.nome}.
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
    background: 'rgba(0,200,83,.12)',
    border: '1px solid rgba(0,200,83,.35)',
    borderRadius: 999,
    padding: '3px 12px',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '.06em',
    textTransform: 'uppercase',
    color: '#00C853',
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
    background: '#00C853',
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
  btnGenero: {
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: 12,
    color: '#f0f0f0',
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 600,
    padding: '18px',
    width: '100%',
    fontFamily: 'inherit',
  },
  btnVoltar: {
    background: 'transparent',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: 'inherit',
    padding: 0,
  },
  linkBox: {
    background: '#0a0a0a',
    border: '1px solid #242424',
    borderRadius: 12,
    padding: '14px 16px',
    fontSize: 13,
    color: '#ffffff',
    wordBreak: 'break-all',
    textAlign: 'left',
    lineHeight: 1.5,
  },
  checkIcon: {
    width: 56,
    height: 56,
    background: 'rgba(0,200,83,.12)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 26,
    margin: '0 auto',
  },
};
