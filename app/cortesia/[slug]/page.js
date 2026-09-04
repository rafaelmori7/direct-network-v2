import CortesiaSlugClient from './CortesiaSlugClient'

export const revalidate = 3600

export async function generateMetadata({ params }) {
  return {
    alternates: { canonical: `/cortesia/${params.slug}` },
  }
}

export default function CortesiaSlugPage() {
  return <CortesiaSlugClient />
}
