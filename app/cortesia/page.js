import CortesiaClient from './CortesiaClient'

export const revalidate = 86400

export const metadata = {
  alternates: { canonical: '/cortesia' },
}

export default function CortesiaPage() {
  return <CortesiaClient />
}
