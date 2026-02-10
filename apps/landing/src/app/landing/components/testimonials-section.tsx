"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

type Testimonial = {
  name: string
  role: string
  image: string
  quote: string
}

const testimonials: Testimonial[] = [
  {
    name: 'Alexandra Mitchell',
    role: 'Hospital CTO',
    image: 'https://notion-avatars.netlify.app/api/avatar?preset=female-1',
    quote:
      'D4Gen helped us test cross-hospital data sharing with clear policy control and full auditability.',
  },
  {
    name: 'James Thompson',
    role: 'Clinical Data Platform Lead',
    image: 'https://notion-avatars.netlify.app/api/avatar?preset=male-1',
    quote: 'The monorepo separation between contracts, circuits, and app logic made collaboration much easier.',
  },
  {
    name: 'Priya Sharma',
    role: 'Research Program Manager',
    image: 'https://notion-avatars.netlify.app/api/avatar?preset=female-2',
    quote:
      'We can validate eligibility requirements with zero-knowledge proofs without requesting raw patient identifiers.',
  },
  {
    name: 'Robert Kim',
    role: 'Security Architect',
    image: 'https://notion-avatars.netlify.app/api/avatar?preset=male-2',
    quote:
      'Policy events and revocations being on-chain gave our compliance team a dependable audit trail.',
  },
  {
    name: 'Maria Santos',
    role: 'Healthcare Integration Engineer',
    image: 'https://notion-avatars.netlify.app/api/avatar?preset=female-3',
    quote:
      'The SDK reduced duplicate integration code and standardized how we interact with storage, contracts, and proofs.',
  },
  {
    name: 'Thomas Anderson',
    role: 'Consortium Coordinator',
    image: 'https://notion-avatars.netlify.app/api/avatar?preset=male-3',
    quote: 'D4Gen gives us a practical base to run multi-organization pilots on Sui testnet.',
  },
  {
    name: 'Lisa Chang',
    role: 'Clinical Operations Lead',
    image: 'https://notion-avatars.netlify.app/api/avatar?preset=female-4',
    quote:
      'The dashboard is clean enough for non-protocol users while still exposing critical policy and audit details.',
  },
  {
    name: 'Michael Foster',
    role: 'Platform Reliability Engineer',
    image: 'https://notion-avatars.netlify.app/api/avatar?preset=male-4',
    quote: 'Our team quickly added proof generation fallbacks because the architecture already anticipated it.',
  },
  {
    name: 'Sophie Laurent',
    role: 'Product Strategy Lead',
    image: 'https://notion-avatars.netlify.app/api/avatar?preset=female-5',
    quote:
      'The system is opinionated where it matters and flexible where organizations need custom workflows.',
  },
  {
    name: 'Daniel Wilson',
    role: 'Backend Engineer',
    image: 'https://notion-avatars.netlify.app/api/avatar?preset=male-5',
    quote: 'Next.js server routes and shared SDK abstractions made secure backend orchestration straightforward.',
  },
  {
    name: 'Natasha Petrov',
    role: 'Applied Cryptography Engineer',
    image: 'https://notion-avatars.netlify.app/api/avatar?preset=female-6',
    quote:
      'Groth16 integration with on-chain verification is usable in practice and easy to reason about in this setup.',
  },
  {
    name: 'Carlos Rivera',
    role: 'Startup Founder',
    image: 'https://notion-avatars.netlify.app/api/avatar?preset=male-6',
    quote: 'D4Gen gave us a clear reference architecture for privacy-preserving healthcare data exchange.',
  },
]

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 sm:py-32">
      <div className="container mx-auto px-8 sm:px-6">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4">Voices from Pilot Teams</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Practical feedback from real deployments
          </h2>
          <p className="text-lg text-muted-foreground">
            Teams across healthcare and research use D4Gen patterns to prototype trusted data-sharing workflows.
          </p>
        </div>

        {/* Testimonials Masonry Grid */}
        <div className="columns-1 gap-4 md:columns-2 md:gap-6 lg:columns-3 lg:gap-4">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="mb-6 break-inside-avoid shadow-none lg:mb-4">
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="bg-muted size-12 shrink-0">
                    <AvatarImage
                      alt={testimonial.name}
                      src={testimonial.image}
                      loading="lazy"
                      width="120"
                      height="120"
                    />
                    <AvatarFallback>
                      {testimonial.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <a href="#" onClick={e => e.preventDefault()} className="cursor-pointer">
                      <h3 className="font-medium hover:text-primary transition-colors">{testimonial.name}</h3>
                    </a>
                    <span className="text-muted-foreground block text-sm tracking-wide">
                      {testimonial.role}
                    </span>
                  </div>
                </div>

                <blockquote className="mt-4">
                  <p className="text-sm leading-relaxed text-balance">{testimonial.quote}</p>
                </blockquote>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
