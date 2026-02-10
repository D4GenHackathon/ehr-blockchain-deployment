import type { Metadata } from 'next'
import { LandingPageContent } from './landing-page-content'

export const metadata: Metadata = {
  title: 'D4Gen - Decentralized Privacy-Preserving EHR Platform',
  description:
    'D4Gen combines Sui, Walrus, Seal, and zkSNARKs to enable secure, privacy-preserving electronic health record sharing across organizations.',
  keywords: [
    'D4Gen',
    'EHR',
    'Sui',
    'Walrus',
    'Seal',
    'zkSNARK',
    'privacy-preserving healthcare',
  ],
  openGraph: {
    title: 'D4Gen - Decentralized Privacy-Preserving EHR Platform',
    description:
      'Securely store, share, and verify healthcare data with decentralized storage, on-chain access control, and zero-knowledge proofs.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'D4Gen - Decentralized Privacy-Preserving EHR Platform',
    description:
      'Privacy-first healthcare data sharing with Sui smart contracts and zkSNARK verification.',
  },
}

export default function LandingPage() {
  return <LandingPageContent />
}
