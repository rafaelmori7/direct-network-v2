import CortesiaSlugClient from './CortesiaSlugClient'

export async function generateMetadata({ params }) {
  return {
    alternates: { canonical: `/cortesia/${params.slug}` },
  }
}

export default function CortesiaSlugPage() {
  return <CortesiaSlugClient />
}
