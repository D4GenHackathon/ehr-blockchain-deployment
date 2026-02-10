"use client"

import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useState } from 'react'

const plans = [
  {
    name: 'Prototype',
    description: 'For internal teams validating core EHR workflows on testnet',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'Single organization sandbox setup',
      'Basic encrypted record upload flow',
      'On-chain policy and event visibility',
      'Starter Groth16 example circuits',
      'Community implementation guidance'
    ],
    cta: 'Start Build',
    popular: false
  },
  {
    name: 'Consortium',
    description: 'For multi-organization pilots with policy governance and audits',
    monthlyPrice: 49,
    yearlyPrice: 39,
    features: [
      'Multi-organization sharing workflows',
      'Seal capability request patterns',
      'Expanded circuit templates and proving helpers',
      'Cross-org audit dashboard modules',
      'Priority implementation support',
      'Integration playbooks for providers',
      'Testnet load and reliability guidance',
      'Security review checklist',
      'Pilot governance templates'
    ],
    cta: 'Request Pilot',
    popular: true,
    includesPrevious: 'All Prototype features, plus'
  },
  {
    name: 'Foundation',
    description: 'For long-term deployment planning and infrastructure hardening',
    monthlyPrice: 299,
    yearlyPrice: 299,
    features: [
      'Architecture review for production rollout',
      'Custom policy and compliance mappings',
      'Dedicated support channel',
      'Roadmap alignment workshops',
      'Advanced observability recommendations',
      'Migration strategy support'
    ],
    cta: 'Talk to Team',
    popular: false,
    includesPrevious: 'All Consortium features, plus'
  }
]

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false)

  return (
    <section id="pricing" className="py-24 sm:py-32 bg-muted/40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-12">
          <Badge variant="outline" className="mb-4">Adoption Tracks</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Choose your rollout phase
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start from a focused prototype, then scale to consortium pilots and long-term infrastructure planning.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-2">
            <ToggleGroup
              type="single"
              value={isYearly ? "yearly" : "monthly"}
              onValueChange={(value) => setIsYearly(value === "yearly")}
              className="bg-secondary text-secondary-foreground border-none rounded-full p-1 cursor-pointer shadow-none"
            >
              <ToggleGroupItem
                value="monthly"
                className="data-[state=on]:bg-background data-[state=on]:border-border border-transparent border px-6 !rounded-full data-[state=on]:text-foreground hover:bg-transparent cursor-pointer transition-colors"
              >
                Monthly
              </ToggleGroupItem>
              <ToggleGroupItem
                value="yearly"
                className="data-[state=on]:bg-background data-[state=on]:border-border border-transparent border px-6 !rounded-full data-[state=on]:text-foreground hover:bg-transparent cursor-pointer transition-colors"
              >
                Annually
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <p className="text-sm text-muted-foreground">
            <span className="text-primary font-semibold">Save 20%</span> on annual planning packages
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto max-w-6xl">
          <div className="rounded-xl border">
            <div className="grid lg:grid-cols-3">
              {plans.map((plan, index) => (
                <div
                  key={index}
                  className={`p-8 grid grid-rows-subgrid row-span-4 gap-6 ${
                    plan.popular
                      ? 'my-2 mx-4 rounded-xl bg-card border-transparent shadow-xl ring-1 ring-foreground/10 backdrop-blur'
                      : ''
                  }`}
                >
                  {/* Plan Header */}
                  <div>
                    <div className="text-lg font-medium tracking-tight mb-2">{plan.name}</div>
                    <div className="text-muted-foreground text-balance text-sm">{plan.description}</div>
                  </div>

                  {/* Pricing */}
                  <div>
                    <div className="text-4xl font-bold mb-1">
                      {plan.name === 'Foundation' ? (
                        `$${plan.monthlyPrice}`
                      ) : plan.name === 'Prototype' ? (
                        '$0'
                      ) : (
                        `$${isYearly ? plan.yearlyPrice : plan.monthlyPrice}`
                      )}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {plan.name === 'Foundation' ? 'Planning package' : 'Per month'}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div>
                    <Button
                      className={`w-full cursor-pointer my-2 ${
                        plan.popular
                          ? 'shadow-md border-[0.5px] border-white/25 shadow-black/20 bg-primary ring-1 ring-primary/15 text-primary-foreground hover:bg-primary/90'
                          : 'shadow-sm shadow-black/15 border border-transparent bg-background ring-1 ring-foreground/10 hover:bg-muted/50'
                      }`}
                      variant={plan.popular ? 'default' : 'secondary'}
                    >
                      {plan.cta}
                    </Button>
                  </div>

                  {/* Features */}
                  <div>
                    <ul role="list" className="space-y-3 text-sm">
                      {plan.includesPrevious && (
                        <li className="flex items-center gap-3 font-medium">
                          {plan.includesPrevious}:
                        </li>
                      )}
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-3">
                          <Check className="text-muted-foreground size-4 flex-shrink-0" strokeWidth={2.5} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enterprise Note */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            Need a custom rollout plan for your organization?{' '}
            <Button variant="link" className="p-0 h-auto cursor-pointer" asChild>
              <a href="#contact">
                Contact our team
              </a>
            </Button>
          </p>
        </div>
      </div>
    </section>
  )
}
