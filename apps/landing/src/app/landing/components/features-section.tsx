"use client"

import {
  BarChart3,
  Zap,
  Users,
  ArrowRight,
  Database,
  Shield,
  Crown,
  Layout,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Image3D } from '@/components/image-3d'

const mainFeatures = [
  {
    icon: Database,
    title: 'Encrypted Storage on Walrus',
    description: 'Medical payloads stay encrypted in decentralized storage, never in plaintext on-chain.'
  },
  {
    icon: Shield,
    title: 'On-Chain Access Control',
    description: 'Policies, shares, and revocations are enforced by auditable Move smart contracts.'
  },
  {
    icon: Lock,
    title: 'Seal Capability Requests',
    description: 'Decryption access is requested and mediated through explicit policy checks.'
  },
  {
    icon: Zap,
    title: 'zkSNARK Verification',
    description: 'Prove attributes like eligibility or consent without revealing personal data.'
  }
]

const secondaryFeatures = [
  {
    icon: Layout,
    title: 'Unified Next.js App',
    description: 'One app hosts landing, dashboard, backend routes, and indexing workflows.'
  },
  {
    icon: Crown,
    title: 'Monorepo by Domain',
    description: 'Contracts, zk circuits, SDK, and apps are separated for independent delivery.'
  },
  {
    icon: Users,
    title: 'Consortium-Ready Model',
    description: 'Hospitals, labs, insurers, and patients coordinate with shared trust assumptions.'
  },
  {
    icon: BarChart3,
    title: 'Auditable Operations',
    description: 'Record creation, sharing, and revocation emit immutable on-chain events.'
  }
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4">Platform Capabilities</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Architecture designed for private healthcare collaboration
          </h2>
          <p className="text-lg text-muted-foreground">
            D4Gen combines blockchain policy enforcement, decentralized encrypted storage, and zero-knowledge proofs to support secure EHR sharing across organizations.
          </p>
        </div>

        {/* First Feature Section */}
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8 xl:gap-16 mb-24">
          {/* Left Image */}
          <Image3D
            lightSrc="/feature-1-light.png"
            darkSrc="/feature-1-dark.png"
            alt="D4Gen policy and storage workflow"
            direction="left"
          />
          {/* Right Content */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                End-to-end privacy guarantees for EHR records
              </h3>
              <p className="text-muted-foreground text-base text-pretty">
                Sensitive health data is encrypted off-chain while protocol-critical metadata and policies are anchored on Sui for traceability and deterministic access control.
              </p>
            </div>

            <ul className="grid gap-4 sm:grid-cols-2">
              {mainFeatures.map((feature, index) => (
                <li key={index} className="group hover:bg-accent/5 flex items-start gap-3 p-2 rounded-lg transition-colors">
                  <div className="mt-0.5 flex shrink-0 items-center justify-center">
                    <feature.icon className="size-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-foreground font-medium">{feature.title}</h3>
                    <p className="text-muted-foreground mt-1 text-sm">{feature.description}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4 pe-4 pt-2">
              <Button size="lg" className="cursor-pointer" asChild>
                <a href="https://d4gen-ehr.vercel.app/dashboard" className='flex items-center'>
                  Open Dashboard
                  <ArrowRight className="ms-2 size-4" aria-hidden="true" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="cursor-pointer" asChild>
                <a href="#faq">
                  Read FAQs
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Second Feature Section - Flipped Layout */}
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8 xl:gap-16">
          {/* Left Content */}
          <div className="space-y-6 order-2 lg:order-1">
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                Built for iterative protocol development
              </h3>
              <p className="text-muted-foreground text-base text-pretty">
                Each package in the monorepo can evolve independently so product teams can ship user workflows while contract and circuit teams harden verification logic.
              </p>
            </div>

            <ul className="grid gap-4 sm:grid-cols-2">
              {secondaryFeatures.map((feature, index) => (
                <li key={index} className="group hover:bg-accent/5 flex items-start gap-3 p-2 rounded-lg transition-colors">
                  <div className="mt-0.5 flex shrink-0 items-center justify-center">
                    <feature.icon className="size-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-foreground font-medium">{feature.title}</h3>
                    <p className="text-muted-foreground mt-1 text-sm">{feature.description}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4 pe-4 pt-2">
              <Button size="lg" className="cursor-pointer" asChild>
                <a href="#contact" className='flex items-center'>
                  Contact Team
                  <ArrowRight className="ms-2 size-4" aria-hidden="true" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="cursor-pointer" asChild>
                <a href="https://github.com/D4GenHackathon/d4gen-deployment" target="_blank" rel="noopener noreferrer">
                  View Repository
                </a>
              </Button>
            </div>
          </div>

          {/* Right Image */}
          <Image3D
            lightSrc="/feature-2-light.png"
            darkSrc="/feature-2-dark.png"
            alt="D4Gen zero-knowledge and audit workflow"
            direction="right"
            className="order-1 lg:order-2"
          />
        </div>
      </div>
    </section>
  )
}
