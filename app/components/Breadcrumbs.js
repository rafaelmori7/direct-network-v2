import Link from 'next/link'

const BASE_URL = 'https://www.directnw.com.br'

// items: [{ label, href }] — o último item é a página atual e não deve ter href.
export default function Breadcrumbs({ items }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      ...(item.href && { item: `${BASE_URL}${item.href}` }),
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <nav aria-label="Breadcrumb" style={{padding:'16px var(--px) 0'}}>
        <ol style={{fontSize:'12px',color:'var(--text-faint)',display:'flex',gap:'6px',alignItems:'center',flexWrap:'wrap',listStyle:'none',margin:'0 0 20px',padding:0}}>
          {items.map((item, i) => (
            <li key={i} style={{display:'flex',alignItems:'center',gap:'6px'}}>
              {i > 0 && <span aria-hidden="true">›</span>}
              {item.href ? (
                <Link href={item.href}>{item.label}</Link>
              ) : (
                <span aria-current="page" style={{color:'var(--text-muted)'}}>{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}
