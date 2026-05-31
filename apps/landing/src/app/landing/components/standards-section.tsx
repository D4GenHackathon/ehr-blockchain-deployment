"use client"

import {
  Database,
  FileOutput,
  KeyRound,
  LockKeyhole,
  ScrollText,
  ShieldCheck,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"

const safeguards = [
  {
    icon: KeyRound,
    standard: "HIPAA",
    title: "Authentication and authorized access",
    description:
      "Login sessions, linked Sui wallets, and admin or doctor action checks restrict EHR operations. Staff views are reduced to metadata.",
    enforcement: "Backend session + role policy",
  },
  {
    icon: LockKeyhole,
    standard: "HIPAA",
    title: "Transmission security",
    description:
      "Full-record transfers are encrypted with Seal before Walrus storage. Private insight requests use Groth16 proofs instead of raw attributes.",
    enforcement: "Seal encryption + zkSNARK disclosure control",
  },
  {
    icon: Database,
    standard: "GDPR",
    title: "Data minimization and storage limitation",
    description:
      "Records are classified as full EHR, selected attributes, metadata-only, or non-EHR. Organization categories receive different views and record limits.",
    enforcement: "Projection + organization limit rules",
  },
  {
    icon: FileOutput,
    standard: "GDPR",
    title: "Structured portability",
    description:
      "Authorized users can export the records visible to their policy context in structured JSON or CSV form.",
    enforcement: "Policy-aware export endpoint",
  },
  {
    icon: ScrollText,
    standard: "HIPAA / GDPR",
    title: "Accountability and auditability",
    description:
      "Record, sharing, import, export, and ZKP actions produce backend activity logs. Sui transactions provide inspectable policy and verification evidence.",
    enforcement: "Activity log + Sui transaction digest",
  },
]

const organizationPolicies = [
  ["Healthcare providers", "Full EHR where permitted", "Up to 500 stored and 500 shared records"],
  ["Clinical / research", "Selected attributes", "Up to 300 stored and 200 shared records"],
  ["Commercial / biotech", "Metadata and non-EHR only", "EHR sharing and sensitive ZKP requests blocked"],
]

export function StandardsSection() {
  return (
    <section id="standards" className="py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <Badge variant="outline" className="mb-4">Standards Guidance</Badge>
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Privacy principles mapped to enforceable controls
          </h2>
          <p className="text-lg text-muted-foreground">
            The prototype maps HIPAA minimum-necessary safeguards, GDPR privacy principles, and National Law
            206/2004 data-usage guidance into application and blockchain rules.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-x-10 gap-y-8 lg:grid-cols-[1.35fr_0.9fr]">
          <div className="divide-y rounded-md border">
            {safeguards.map((safeguard) => (
              <div key={safeguard.title} className="flex gap-4 p-5 sm:p-6">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <safeguard.icon className="size-5" />
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{safeguard.standard}</Badge>
                    <h3 className="font-semibold">{safeguard.title}</h3>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{safeguard.description}</p>
                  <p className="text-xs font-medium text-primary">{safeguard.enforcement}</p>
                </div>
              </div>
            ))}
          </div>

          <aside className="space-y-5">
            <div className="rounded-md border bg-muted/20 p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                <h3 className="font-semibold">Organization policy matrix</h3>
              </div>
              <div className="space-y-4">
                {organizationPolicies.map(([organization, access, limits]) => (
                  <div key={organization} className="border-b pb-4 last:border-b-0 last:pb-0">
                    <p className="text-sm font-medium">{organization}</p>
                    <p className="mt-1 text-xs text-primary">{access}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{limits}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border p-5 text-xs leading-5 text-muted-foreground sm:p-6">
              <p className="font-medium text-foreground">Implementation scope</p>
              <p className="mt-2">
                These controls describe the technical safeguards implemented by this prototype. They are not a legal
                certification. Production deployment still requires organizational review, operational controls, and
                jurisdiction-specific assessment.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
