import CortesiaClient from './CortesiaClient'

export const revalidate = 3600

export const metadata = {
  alternates: { canonical: '/cortesia' },
}

export default function CortesiaPage() {
  return <CortesiaClient />
}
