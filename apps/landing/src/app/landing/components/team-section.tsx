"use client"

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CardDecorator } from '@/components/ui/card-decorator'
import { Github, Linkedin, Globe } from 'lucide-react'


const team = [
  {
    id: 1,
    name: 'Hans',
    role: 'Developer',
    description: 'Blockchain, cryptography, and product delivery',
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?q=60&w=150&auto=format&fit=crop',
    fallback: 'AC',
    social: {
      linkedin: '#',
      github: '#',
      website: '#'
    }
  },
  // {
  //   id: 2,
  //   name: 'Marcus Rodriguez',
  //   role: 'Move Engineer',
  //   description: 'Builds auditable contract flows for record metadata, sharing, and revocation.',
  //   image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=60&w=150&auto=format&fit=crop',
  //   fallback: 'MR',
  //   social: {
  //     linkedin: '#',
  //     github: '#',
  //     website: '#'
  //   }
  // },
  // {
  //   id: 3,
  //   name: 'Sophie Laurent',
  //   role: 'Product Manager',
  //   description: 'Defines cross-organization data workflows and compliance-driven product requirements.',
  //   image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=60&w=150&auto=format&fit=crop',
  //   fallback: 'SL',
  //   social: {
  //     linkedin: '#',
  //     github: '#',
  //     website: '#'
  //   }
  // },
  // {
  //   id: 4,
  //   name: 'David Kim',
  //   role: 'Frontend Engineer',
  //   description: 'Implements operator and patient dashboards with consistent design system patterns.',
  //   image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=60&w=150&auto=format&fit=crop',
  //   fallback: 'DK',
  //   social: {
  //     linkedin: '#',
  //     github: '#',
  //     website: '#'
  //   }
  // },
  // {
  //   id: 5,
  //   name: 'Emma Thompson',
  //   role: 'Backend Engineer',
  //   description: 'Owns API routes, indexing jobs, and secure orchestration between chain and storage.',
  //   image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=60&w=150&auto=format&fit=crop',
  //   fallback: 'ET',
  //   social: {
  //     linkedin: '#',
  //     github: '#',
  //     website: '#'
  //   }
  // },
  // {
  //   id: 6,
  //   name: 'Ryan Mitchell',
  //   role: 'Applied Cryptography',
  //   description: 'Designs Groth16 circuit constraints and proof pipelines for selective disclosure.',
  //   image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=60&w=150&auto=format&fit=crop',
  //   fallback: 'RM',
  //   social: {
  //     linkedin: '#',
  //     github: '#',
  //     website: '#'
  //   }
  // },
  // {
  //   id: 7,
  //   name: 'James Anderson',
  //   role: 'Security Researcher',
  //   description: 'Reviews threat models, key management assumptions, and policy abuse scenarios.',
  //   image: 'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?q=60&w=150&auto=format&fit=crop',
  //   fallback: 'JA',
  //   social: {
  //     linkedin: '#',
  //     github: '#',
  //     website: '#'
  //   }
  // },
  // {
  //   id: 8,
  //   name: 'Isabella Garcia',
  //   role: 'Ecosystem Partnerships',
  //   description: 'Supports consortium onboarding across hospitals, clinics, and research teams.',
  //   image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=60&w=150&auto=format&fit=crop',
  //   fallback: 'IG',
  //   social: {
  //     linkedin: '#',
  //     github: '#',
  //     website: '#'
  //   }
  // }
]

export function TeamSection() {
  return (
    <section id="team" className="py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-4xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Team
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
            Builders behind D4Gen
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            A cross-functional team across protocol engineering, cryptography, and product delivery focused on privacy-preserving healthcare interoperability.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-4">
          {team.map((member) => (
            <Card key={member.id} className="shadow-xs py-2">
              <CardContent className="p-4">
                <div className="text-center">
                  {/* Avatar */}
                  <div className="flex justify-center mb-4">
                    <CardDecorator>
                      <Avatar className="h-24 w-24 border shadow-lg">
                        <AvatarImage
                          src={member.image}
                          alt={member.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="text-lg font-semibold">
                          {member.fallback}
                        </AvatarFallback>
                      </Avatar>
                    </CardDecorator>
                  </div>

                  {/* Name and Role */}
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {member.name}
                  </h3>
                  <p className="text-sm font-medium text-primary mb-3">
                    {member.role}
                  </p>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {member.description}
                  </p>

                  {/* Social Links */}
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 cursor-pointer hover:text-primary"
                      asChild
                    >
                      <a
                        href={member.social.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${member.name} LinkedIn`}
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 cursor-pointer hover:text-primary"
                      asChild
                    >
                      <a
                        href={member.social.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${member.name} GitHub`}
                      >
                        <Github className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 cursor-pointer hover:text-primary"
                      asChild
                    >
                      <a
                        href={member.social.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${member.name} Website`}
                      >
                        <Globe className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
