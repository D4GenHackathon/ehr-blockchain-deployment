"use client"

import {
  Shield,
  BarChart3,
  Database,
  Building2,
  Rocket,
  Settings,
  Zap,
  Package,
  Layout,
  Crown,
  Lock,
} from 'lucide-react'

const menuSections = [
  {
    title: 'Core Layers',
    items: [
      {
        title: 'Web Application',
        description: 'Unified Next.js app for dashboard, backend routes, and indexer flows',
        icon: Layout,
        href: '#features'
      },
      {
        title: 'Sui Contracts',
        description: 'Move modules for policies, shares, revocations, and audit events',
        icon: Crown,
        href: '#features'
      },
      {
        title: 'zk Circuits',
        description: 'Groth16 circuits for selective disclosure and compliance proofs',
        icon: BarChart3,
        href: '#features'
      },
      {
        title: 'D4Gen SDK',
        description: 'Shared TypeScript clients for chain, storage, and proof orchestration',
        icon: Package,
        href: '#features'
      }
    ]
  },
  {
    title: 'Privacy Controls',
    items: [
      {
        title: 'Encrypted Storage',
        description: 'Store encrypted medical blobs on decentralized infrastructure',
        icon: Database,
        href: '#features'
      },
      {
        title: 'Access Policies',
        description: 'Gate decryption and sharing through explicit on-chain rules',
        icon: Shield,
        href: '#features'
      },
      {
        title: 'Seal Requests',
        description: 'Request scoped decryption capability only when policy permits',
        icon: Lock,
        href: '#features'
      },
      {
        title: 'Zero-Knowledge Checks',
        description: 'Prove attributes like consent or age without revealing identity',
        icon: Rocket,
        href: '#features'
      }
    ]
  },
  {
    title: 'Operations',
    items: [
      {
        title: 'Organization Flows',
        description: 'Coordinate hospitals, clinics, and research partners securely',
        icon: Building2,
        href: '#team'
      },
      {
        title: 'Audit Timeline',
        description: 'Track immutable events for record creation and access changes',
        icon: Zap,
        href: '#pricing'
      },
      {
        title: 'Deployment Notes',
        description: 'Prototype-first architecture with testnet-ready defaults',
        icon: Settings,
        href: '#faq'
      },
      {
        title: 'Support',
        description: 'Roadmap and integration support for consortium onboarding',
        icon: Database,
        href: '#contact'
      }
    ]
  }
]

export function MegaMenu() {
  return (
    <div className="w-[700px] max-w-[95vw] p-4 sm:p-6 lg:p-8 bg-background">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
        {menuSections.map((section) => (
          <div key={section.title} className="space-y-4 lg:space-y-6">
            {/* Section Header */}
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {section.title}
            </h3>

            {/* Section Links */}
            <div className="space-y-3 lg:space-y-4">
              {section.items.map((item) => (
                <a
                  key={item.title}
                  href={item.href}
                  className="group block space-y-1 lg:space-y-2 hover:bg-accent rounded-md p-2 lg:p-3 -mx-2 lg:-mx-3 transition-colors my-0"
                >
                  <div className="flex items-center gap-2 lg:gap-3">
                    <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed ml-6 lg:ml-7">
                    {item.description}
                  </p>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
