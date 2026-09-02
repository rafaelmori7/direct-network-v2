'use client';

import { useState } from 'react';
import Image from 'next/image';

// ─────────────────────────────────────────────
// CONFIGURAÇÃO DO EVENTO — edite aqui
// ─────────────────────────────────────────────
const EVENTO = {
  nome: 'DDP Diretoria',
  data: '26 de Junho · 2026',
  horario: 'A partir de 22h',
  local: 'Casa Aragon',
  endereco: 'São Paulo — SP',
  imagemUrl: 'ddp1.jpg',       // coloque a imagem em /public/cathouse.jpg
  linkCortesia: 'https://www.gandaya.dance/events/ddp-em-sp-3e16?link=direct_',
};

// URL do Google Apps Script
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzV3DIPGFkVQ8T1LXu0EFbO6cEl_etVYrTqjjXLsj6GJghHP-D6orHLYEeL__gLJe_Org/exec';
// ─────────────────────────────────────────────

export default function CortesiaClient() {
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [resgatado, setResgatado] = useState(false);
  const [copiado, setCopiado] = useState(false);

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
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          evento: EVENTO.nome,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (_) {
      // no-cors: erros de rede são silenciosos; segue normalmente
    }

    setLoading(false);
    setResgatado(true);
  }

  function copiarLink() {
    navigator.clipboard.writeText(EVENTO.linkCortesia).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 16px 64px' }}>

      {/* Logo */}
      <div style={{ marginBottom: 32 }}>
        <img src="/logo.png" alt="Direct Network" style={{ height: 36, objectFit: 'contain' }} />
      </div>

      <div style={{
        width: '100%',
        maxWidth: 440,
        background: '#141414',
        border: '1px solid #242424',
        borderRadius: 20,
        overflow: 'hidden',
      }}>

        {/* Banner do evento */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/7', background: '#1a1a1a' }}>
          <img
            src={EVENTO.imagemUrl}
            alt={EVENTO.nome}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 40%, #141414 100%)',
          }} />
        </div>

        <div style={{ padding: '24px 28px 32px' }}>

          {/* Infos do evento */}
          <div style={{ marginBottom: 28 }}>
            <span style={{
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
            }}>
              Cortesia
            </span>

            <h1 style={{
              fontFamily: 'var(--font-display, sans-serif)',
              fontSize: 26,
              fontWeight: 800,
              color: '#f0f0f0',
              lineHeight: 1.2,
              marginBottom: 14,
            }}>
              {EVENTO.nome}
            </h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <InfoRow icon="📅" texto={EVENTO.data} />
              <InfoRow icon="🕐" texto={EVENTO.horario} />
              <InfoRow icon="📍" texto={`${EVENTO.local} · ${EVENTO.endereco}`} />
            </div>
          </div>

          <div style={{ height: 1, background: '#242424', marginBottom: 28 }} />

          {/* Formulário ou sucesso */}
          {!resgatado ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <p style={{ fontSize: 14, color: '#aaa', lineHeight: 1.55, marginBottom: 16 }}>
                  Informe seu e-mail para liberar o link do ingresso gratuito.
                </p>

                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#ccc', marginBottom: 8 }}>
                  Seu e-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="voce@email.com"
                  style={{
                    width: '100%',
                    background: '#0a0a0a',
                    border: `1px solid ${erro ? '#ff6b6b' : '#242424'}`,
                    borderRadius: 12,
                    color: '#f0f0f0',
                    fontSize: 15,
                    padding: '13px 16px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
                {erro && <p style={{ fontSize: 12, color: '#ff6b6b', marginTop: 6 }}>{erro}</p>}
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  background: '#ff2d78',
                  border: 'none',
                  borderRadius: 12,
                  color: '#fff',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: 15,
                  fontWeight: 600,
                  padding: '15px',
                  width: '100%',
                  opacity: loading ? 0.6 : 1,
                  fontFamily: 'inherit',
                  transition: 'opacity .2s',
                }}
              >
                {loading ? 'Aguarde...' : 'Liberar meu ingresso'}
              </button>

              <p style={{ fontSize: 11, color: '#444', textAlign: 'center' }}>
                Seus dados são usados apenas para controle de acesso.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56,
                background: 'rgba(255,45,120,.12)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26,
                margin: '0 auto',
              }}>
                🎟️
              </div>

              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f0f0f0', marginBottom: 6 }}>
                  Ingresso liberado!
                </h2>
                <p style={{ fontSize: 14, color: '#888', lineHeight: 1.55 }}>
                  Acesse o link abaixo para retirar sua cortesia em {EVENTO.local}.
                </p>
              </div>

              <div style={{
                background: '#0a0a0a',
                border: '1px solid #242424',
                borderRadius: 12,
                padding: '14px 16px',
                fontSize: 13,
                color: '#ff2d78',
                wordBreak: 'break-all',
                textAlign: 'left',
                lineHeight: 1.5,
              }}>
                {EVENTO.linkCortesia}
              </div>

              <a
                href={EVENTO.linkCortesia}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#ff2d78',
                  borderRadius: 12,
                  color: '#fff',
                  display: 'block',
                  fontSize: 15,
                  fontWeight: 600,
                  padding: '15px',
                  textDecoration: 'none',
                  textAlign: 'center',
                }}
              >
                Retirar ingresso →
              </a>

              <button
                onClick={copiarLink}
                style={{
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
                  transition: 'border-color .18s',
                }}
              >
                {copiado ? '✓ Copiado!' : 'Copiar link'}
              </button>

              <p style={{ fontSize: 11, color: '#444' }}>
                Guarde o link — ele é seu ingresso para {EVENTO.nome}.
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
