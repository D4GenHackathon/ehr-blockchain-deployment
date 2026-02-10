"use client"

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CardDecorator } from '@/components/ui/card-decorator'
import { Github, Code, ShieldCheck, Layout, Crown } from 'lucide-react'

const values = [
  {
    icon: Code,
    title: 'Protocol First',
    description: 'Core logic lives in contracts, circuits, and SDKs so behavior is explicit and testable across applications.'
  },
  {
    icon: ShieldCheck,
    title: 'Privacy by Design',
    description: 'PII and PHI stay encrypted off-chain while on-chain state contains only commitments, policies, and audit traces.'
  },
  {
    icon: Layout,
    title: 'Composable Monorepo',
    description: 'Each package can evolve independently while keeping interfaces stable for frontend and backend integration.'
  },
  {
    icon: Crown,
    title: 'Pragmatic Delivery',
    description: 'The architecture is optimized for rapid end-to-end prototyping without sacrificing correctness or extensibility.'
  }
]

export function AboutSection() {
  return (
    <section id="about" className="py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-4xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            About D4Gen
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
            Decentralized trust for healthcare collaboration
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            D4Gen is built to help institutions share health data with strict privacy guarantees, verifiable policy enforcement,
            and transparent auditability across organizational boundaries.
          </p>
        </div>

        {/* Modern Values Grid with Enhanced Design */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-4 mb-12">
          {values.map((value, index) => (
            <Card key={index} className='group shadow-xs py-2'>
              <CardContent className='p-8'>
                <div className='flex flex-col items-center text-center'>
                  <CardDecorator>
                    <value.icon className='h-6 w-6' aria-hidden />
                  </CardDecorator>
                  <h3 className='mt-6 font-medium text-balance'>{value.title}</h3>
                  <p className='text-muted-foreground mt-3 text-sm'>{value.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-muted-foreground">Built for secure interoperability across the healthcare ecosystem</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="cursor-pointer" asChild>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </a>
            </Button>
            <Button size="lg" variant="outline" className="cursor-pointer" asChild>
              <a href="#contact">
                Contact the Team
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
