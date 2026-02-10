"use client"

import { CircleHelp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'

type FaqItem = {
  value: string
  question: string
  answer: string
}

const faqItems: FaqItem[] = [
  {
    value: 'item-1',
    question: 'What does D4Gen store on-chain versus off-chain?',
    answer:
      'D4Gen keeps policy state, commitments, and audit events on Sui. Encrypted medical payloads are stored off-chain on decentralized storage. This separates verification from sensitive data custody.',
  },
  {
    value: 'item-2',
    question: 'How is access to medical data controlled?',
    answer:
      'Access is managed through explicit on-chain policies and share/revoke flows in Move contracts. Decryption capability requests are checked against those policies before data can be unlocked.',
  },
  {
    value: 'item-3',
    question: 'Why use zkSNARKs in this platform?',
    answer:
      'zkSNARKs let participants prove facts like eligibility or consent without revealing raw personal information. D4Gen uses Groth16 proofs and verifies them on-chain in Sui contracts.',
  },
  {
    value: 'item-4',
    question: 'Can I run proof generation inside the web backend?',
    answer:
      'Yes. The baseline setup supports server-side proof generation with snarkjs. For heavier workloads, a dedicated prover service using rapidsnark can be added as a fallback execution path.',
  },
  {
    value: 'item-5',
    question: 'Which environment is recommended for development?',
    answer:
      'The current scaffold is optimized for Sui testnet. This allows teams to iterate on contracts, indexing, and proof verification quickly before discussing production hardening.',
  },
  {
    value: 'item-6',
    question: 'How is the monorepo organized?',
    answer:
      'Apps and packages are separated by domain: web application, contracts, zk circuits, and shared SDK. The structure is intentionally modular so each layer can evolve independently.',
  },
]

const FaqSection = () => {
  return (
    <section id="faq" className="py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4">FAQ</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Key information about D4Gen architecture, privacy model, proof workflows, and development setup.
          </p>
        </div>

        {/* FAQ Content */}
        <div className="max-w-4xl mx-auto">
          <div className='bg-transparent'>
            <div className='p-0'>
              <Accordion type='single' collapsible className='space-y-5'>
                {faqItems.map(item => (
                  <AccordionItem key={item.value} value={item.value} className='rounded-md !border bg-transparent'>
                    <AccordionTrigger className='cursor-pointer items-center gap-4 rounded-none bg-transparent py-2 ps-3 pe-4 hover:no-underline data-[state=open]:border-b'>
                      <div className='flex items-center gap-4'>
                        <div className='bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full'>
                          <CircleHelp className='size-5' />
                        </div>
                        <span className='text-start font-semibold'>{item.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className='p-4 bg-transparent'>{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>

          {/* Contact Support CTA */}
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Need architecture support for your use case?
            </p>
            <Button className='cursor-pointer' asChild>
              <a href="#contact">
                Contact Team
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export { FaqSection }
