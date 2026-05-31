"use client";

import {
  Database,
  FileOutput,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Waypoints,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type UseCase = "sharing" | "verification";

const policyMatrix = [
  {
    organization: "Healthcare providers",
    access: "Full EHR where permitted",
    limits: "Up to 500 stored and 500 shared records",
  },
  {
    organization: "Clinical / research",
    access: "Selected attributes",
    limits: "Up to 300 stored and 200 shared records",
  },
  {
    organization: "Commercial / biotech",
    access: "Metadata and non-EHR only",
    limits: "Up to 300 non-EHR records; EHR sharing and sensitive ZKP queries blocked",
  },
];

const sharingSteps = [
  "The backend checks the authenticated user's role, organization type, requested records, and the holder's share limit.",
  "The holder signs Sui transactions to create a Seal allowlist and grant the requester access.",
  "The browser encrypts the selected EHR records with Seal before uploading ciphertext to Walrus.",
  "The requester signs a Seal session message, downloads the Walrus blob, and decrypts it locally.",
  "Import is checked against the receiving organization's storage limit and recorded in the activity log.",
];

const verificationSteps = [
  "The backend allows only admins and doctors from eligible organizations to create or operate sensitive ZKP requests.",
  "The requester sends public conditions only, such as a date range or medication identifier.",
  "The holder builds the private witness from its local EHR profile and sends it to the dedicated prover service.",
  "The requester receives the proof result and submits it to Sui native Groth16 verification through zk_verifier::verify_oneshot.",
  "The UI records the Sui transaction digest and matched result without disclosing the holder's private witness to the requester.",
];

function SummaryItem({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof ShieldCheck;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3 rounded-md border p-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs leading-5 text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

export function ComplianceStandardsDialog({ useCase }: { useCase: UseCase }) {
  const isSharing = useCase === "sharing";
  const flowSteps = isSharing ? sharingSteps : verificationSteps;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ShieldCheck className="size-4" />
          Standards Applied
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            EHR Standards Applied
          </DialogTitle>
          <DialogDescription>
            How this demo maps healthcare privacy guidance to enforceable application and blockchain controls.
            This is a technical implementation summary, not a legal compliance certification.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryItem
            icon={KeyRound}
            title="HIPAA: authorized access"
            text="Login sessions, admin and doctor action checks, staff metadata-only views, and organization-level projections apply the minimum-necessary principle."
          />
          <SummaryItem
            icon={LockKeyhole}
            title="HIPAA: transmission security"
            text="Seal protects full-record transfers before Walrus storage. Sensitive insight requests use Groth16 proofs instead of exposing the underlying EHR attributes."
          />
          <SummaryItem
            icon={Database}
            title="GDPR: data minimization"
            text="Records are classified as full EHR, selected attributes, metadata-only, or non-EHR. Storage and sharing limits are enforced by organization category."
          />
          <SummaryItem
            icon={FileOutput}
            title="GDPR: portability and audit"
            text="Authorized users can export projected records as JSON or CSV. Data actions are written to the activity log with STANDARD.md metadata."
          />
        </div>

        <Accordion type="multiple" defaultValue={["current-flow"]} className="rounded-md border px-4">
          <AccordionItem value="current-flow">
            <AccordionTrigger>
              {isSharing ? "Use case 1: Seal + Walrus record sharing" : "Use case 2: ZKP insight verification"}
            </AccordionTrigger>
            <AccordionContent>
              <ol className="space-y-2 pl-4 text-xs leading-5 text-muted-foreground">
                {flowSteps.map((step, index) => (
                  <li key={step}>
                    <span className="mr-2 font-medium text-foreground">{index + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="policy">
            <AccordionTrigger>Organization policy matrix</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {policyMatrix.map((row) => (
                  <div key={row.organization} className="rounded-md border p-3 text-xs">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <p className="font-medium">{row.organization}</p>
                      <Badge variant="secondary">{row.access}</Badge>
                    </div>
                    <p className="leading-5 text-muted-foreground">{row.limits}</p>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="enforcement">
            <AccordionTrigger>Where controls are enforced</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-xs leading-5 text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Backend policy:</span> authenticated role checks,
                  organization restrictions, record projections, storage limits, sharing limits, ZKP eligibility,
                  and structured exports.
                </p>
                <p>
                  <span className="font-medium text-foreground">Sui blockchain:</span> signed Seal allowlist
                  transactions, EHR audit events, compliance policy rules, and native Groth16 verification events.
                </p>
                <p>
                  <span className="font-medium text-foreground">Privacy boundary:</span> plaintext EHR records are
                  not written on-chain. Full transfers are encrypted before Walrus storage; ZKP requests disclose
                  public conditions and proof results only.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="guidance">
            <AccordionTrigger>Standards guidance mapped by this project</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-xs leading-5 text-muted-foreground">
                <p>
                  <Badge variant="outline" className="mr-2">HIPAA</Badge>
                  Minimum necessary standard and technical safeguards for authentication, access control, and
                  transmission security.
                </p>
                <p>
                  <Badge variant="outline" className="mr-2">GDPR</Badge>
                  Data minimization, purpose-aware access control, constrained storage, and structured data
                  portability.
                </p>
                <p>
                  <Badge variant="outline" className="mr-2">National Law 206/2004</Badge>
                  Data-usage guidance represented through the same restricted-access and privacy controls.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
          <Waypoints className="size-4 shrink-0 text-primary" />
          Switch between the two hubs to inspect each workflow. The same policy layer is applied to record CRUD,
          sharing, imports, exports, and ZKP requests.
        </div>
      </DialogContent>
    </Dialog>
  );
}
