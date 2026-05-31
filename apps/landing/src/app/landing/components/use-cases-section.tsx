"use client"

import {
  ArrowRight,
  Database,
  FileKey2,
  LockKeyhole,
  ShieldCheck,
  Waypoints,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const useCases = [
  {
    eyebrow: "Use case 1",
    title: "Share approved EHR records across hospitals",
    description:
      "For non-sensitive sharing workflows, the holder hospital encrypts selected records with Seal, stores ciphertext on Walrus, and grants a requester wallet access through a signed Sui policy.",
    icon: Database,
    method: "Seal + Walrus + Sui allowlist",
    dataClass: "Approved record transfer",
    steps: [
      "Authenticate the requester and resolve its linked wallet.",
      "Create and sign a dedicated Seal allowlist policy on Sui.",
      "Encrypt selected records locally before uploading the Walrus blob.",
      "Decrypt only after the requester signs an authorized Seal session.",
    ],
  },
  {
    eyebrow: "Use case 2",
    title: "Answer sensitive EHR questions without exposing records",
    description:
      "For sensitive insights, the holder hospital builds a private witness from its EHR profile. A Groth16 proof answers the request and Sui native verification records the result without revealing private values.",
    icon: FileKey2,
    method: "Groth16 zkSNARK + Sui verify_oneshot",
    dataClass: "Selective-disclosure insight",
    steps: [
      "Submit public conditions such as a date range or medication identifier.",
      "Load private witness values from the holder hospital record only.",
      "Generate a Groth16 proof through the dedicated prover service.",
      "Verify the proof on Sui and disclose only matched or not matched.",
    ],
  },
]

export function UseCasesSection() {
  return (
    <section id="use-cases" className="border-y bg-muted/20 py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <Badge variant="outline" className="mb-4">Working Use Cases</Badge>
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Choose the disclosure level that matches the clinical need
          </h2>
          <p className="text-lg text-muted-foreground">
            D4Gen separates full-record collaboration from private insight verification so each request reveals only
            what the receiving organization needs.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {useCases.map((useCase) => (
            <article key={useCase.eyebrow} className="rounded-md border bg-background p-6 shadow-xs sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <useCase.icon className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-primary">{useCase.eyebrow}</p>
                  <h3 className="mt-1 text-xl font-semibold">{useCase.title}</h3>
                </div>
              </div>

              <p className="mt-5 text-sm leading-6 text-muted-foreground">{useCase.description}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Badge variant="secondary">
                  <LockKeyhole className="size-3" />
                  {useCase.method}
                </Badge>
                <Badge variant="outline">
                  <ShieldCheck className="size-3" />
                  {useCase.dataClass}
                </Badge>
              </div>

              <ol className="mt-6 space-y-3 border-t pt-5">
                {useCase.steps.map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 text-center sm:flex-row">
          <Waypoints className="size-5 text-primary" />
          <p className="text-sm text-muted-foreground">
            Both workflows apply the same authenticated organization policy layer and produce reviewable audit data.
          </p>
          <Button variant="link" asChild className="h-auto p-0">
            <a href="#standards">
              Review standards
              <ArrowRight className="size-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
