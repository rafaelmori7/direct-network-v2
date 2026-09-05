import CortesiaSlugClient from './CortesiaSlugClient'

export const revalidate = 7200

export async function generateMetadata({ params }) {
  return {
    alternates: { canonical: `/cortesia/${params.slug}` },
  }
}

export default function CortesiaSlugPage() {
  return <CortesiaSlugClient />
}
