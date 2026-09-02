import CortesiaClient from './CortesiaClient'

export const metadata = {
  alternates: { canonical: '/cortesia' },
}

export default function CortesiaPage() {
  return <CortesiaClient />
}
