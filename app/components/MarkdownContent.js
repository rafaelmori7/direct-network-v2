import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Renderiza o campo "descrição" (Contentful) como markdown de verdade —
// headings, listas, negrito e tabelas (GFM), em vez de texto literal com
// os "##" aparecendo na tela. Os headings do markdown começam em <h2>
// (nunca <h1>) porque a página já tem seu próprio <h1> — evita duplicar
// o heading principal e mantém a hierarquia semântica correta.
export default function MarkdownContent({ children, fontSize = 15, lineHeight = 1.75 }) {
  if (!children) return null

  const textColor = 'var(--text-muted)'
  const headingColor = 'var(--text)'

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h2 style={{ fontFamily: 'var(--font-display)', fontSize: fontSize + 7, fontWeight: 700, color: headingColor, margin: '20px 0 10px', lineHeight: 1.3 }}>{children}</h2>,
        h2: ({ children }) => <h3 style={{ fontFamily: 'var(--font-display)', fontSize: fontSize + 5, fontWeight: 700, color: headingColor, margin: '20px 0 10px', lineHeight: 1.3 }}>{children}</h3>,
        h3: ({ children }) => <h4 style={{ fontFamily: 'var(--font-display)', fontSize: fontSize + 3, fontWeight: 600, color: headingColor, margin: '16px 0 8px', lineHeight: 1.3 }}>{children}</h4>,
        h4: ({ children }) => <h5 style={{ fontFamily: 'var(--font-display)', fontSize: fontSize + 1, fontWeight: 600, color: headingColor, margin: '14px 0 6px', lineHeight: 1.3 }}>{children}</h5>,
        h5: ({ children }) => <h6 style={{ fontSize, fontWeight: 600, color: headingColor, margin: '12px 0 6px' }}>{children}</h6>,
        h6: ({ children }) => <h6 style={{ fontSize: fontSize - 1, fontWeight: 600, color: headingColor, margin: '12px 0 6px' }}>{children}</h6>,
        p: ({ children }) => <p style={{ fontSize, color: textColor, lineHeight, margin: '0 0 12px' }}>{children}</p>,
        ul: ({ children }) => <ul style={{ margin: '0 0 12px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>{children}</ul>,
        ol: ({ children }) => <ol style={{ margin: '0 0 12px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>{children}</ol>,
        li: ({ children }) => <li style={{ fontSize, color: textColor, lineHeight }}>{children}</li>,
        strong: ({ children }) => <strong style={{ color: headingColor, fontWeight: 700 }}>{children}</strong>,
        em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
        del: ({ children }) => <del style={{ opacity: 0.6 }}>{children}</del>,
        a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--pink)', textDecoration: 'underline' }}>{children}</a>,
        hr: () => <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />,
        blockquote: ({ children }) => <blockquote style={{ borderLeft: '2px solid var(--pink)', paddingLeft: '12px', margin: '0 0 12px', color: textColor }}>{children}</blockquote>,
        code: ({ children }) => <code style={{ fontFamily: 'monospace', fontSize: fontSize - 1, background: 'var(--bg3)', padding: '2px 5px', borderRadius: '4px', color: headingColor }}>{children}</code>,
        pre: ({ children }) => <pre style={{ background: 'var(--bg3)', padding: '12px 14px', borderRadius: '8px', overflowX: 'auto', marginBottom: '12px' }}>{children}</pre>,
        table: ({ children }) => <div style={{ overflowX: 'auto', marginBottom: '12px' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fontSize - 1 }}>{children}</table></div>,
        th: ({ children }) => <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--border)', color: headingColor, fontWeight: 600 }}>{children}</th>,
        td: ({ children }) => <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', color: textColor }}>{children}</td>,
      }}
    >
      {children}
    </ReactMarkdown>
  )
}
