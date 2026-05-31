"use client";

import { CheckCircle2, Circle, DatabaseZap, LoaderCircle, ShieldCheck, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  StandardInsightHoverCard,
  type StandardInsight,
} from "@/components/standard-insight-hover-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useSealDecrypt } from "@/hooks/use-seal-ops";
import { walrusDownload } from "@/lib/walrus-rest";

const STEPS = [
  {
    id: "download",
    label: "Download encrypted blob from Walrus",
    insight: {
      title: "Retrieve protected data",
      standards: ["HIPAA transmission security", "GDPR security of processing"],
      method: "Walrus ciphertext download",
      detail: "The requester downloads encrypted bytes only. The visible blob preview demonstrates that EHR plaintext is not stored in Walrus.",
    },
  },
  {
    id: "session",
    label: "Create decryption session (sign in wallet)",
    insight: {
      title: "Verify the requester before access",
      standards: ["HIPAA authentication", "HIPAA access control"],
      method: "Sui wallet-signed Seal session",
      detail: "Seal key servers require a signed session from the allowlisted wallet before releasing the capability needed to decrypt.",
    },
  },
  {
    id: "decrypt",
    label: "Decrypt data with Seal",
    insight: {
      title: "Decrypt for the authorized recipient",
      standards: ["HIPAA minimum necessary", "GDPR data minimization"],
      method: "Local Seal decryption",
      detail: "The browser decrypts only the records selected for the approved request. Plaintext is shown after access checks succeed.",
    },
  },
  {
    id: "save",
    label: "Confirm receipt on server",
    insight: {
      title: "Record the access event",
      standards: ["HIPAA audit controls", "GDPR accountability"],
      method: "Backend workflow status and activity log",
      detail: "The server records that the authorized requester opened the transfer, creating a reviewable access history.",
    },
  },
] as const;

const DATA_INSIGHTS = {
  encryptedBlob: {
    title: "Ciphertext preview",
    standards: ["HIPAA transmission security", "GDPR security of processing"],
    method: "Encrypted Walrus payload",
    detail: "This preview is the stored and transmitted form of the data. It remains unreadable until the approved wallet completes the Seal session flow.",
  },
  decryptedRecords: {
    title: "Authorized plaintext view",
    standards: ["HIPAA access control", "HIPAA minimum necessary"],
    method: "Post-authorization local display",
    detail: "The application displays the selected EHR records only after the requester wallet is authenticated and authorized by the Seal policy.",
  },
  importRecords: {
    title: "Controlled EHR import",
    standards: ["GDPR storage limitation", "HIPAA audit controls"],
    method: "Backend import policy and activity log",
    detail: "Before import, the backend checks the receiving organization's category and storage limit. Successful imports are written to the activity log.",
  },
} satisfies Record<string, StandardInsight>;

type StepId = (typeof STEPS)[number]["id"];
type StepStatus = "idle" | "running" | "done" | "error";

interface PatientRecord {
  id?: string;
  patientCode?: string;
  fullName?: string;
  age?: number;
  gender?: string;
  bloodType?: string;
  medicalCondition?: string;
  dateOfAdmission?: number;
  dischargeDate?: number;
  doctorName?: string;
  medication?: string;
  testResults?: string;
  admissionType?: string;
  billingAmount?: number;
  roomNumber?: string | number;
  insuranceProvider?: string;
  status?: string;
  [key: string]: unknown;
}

interface OpenRecordFlowProps {
  shareRequestId: string;
  walrusBlobId: string;
  sealPolicyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function StepRow({
  label,
  status,
  insight,
}: {
  label: string;
  status: StepStatus;
  insight: StandardInsight;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      {status === "idle" && <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
      {status === "running" && <LoaderCircle className="h-4 w-4 animate-spin text-primary shrink-0" />}
      {status === "done" && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
      {status === "error" && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
      <span className={`text-sm ${status === "running" ? "font-medium" : status === "done" ? "text-muted-foreground line-through" : ""}`}>
        {label}
      </span>
      <StandardInsightHoverCard {...insight} />
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string | number | undefined | null }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{String(value)}</span>
    </>
  );
}

function RecordCard({ record, index }: { record: PatientRecord; index: number }) {
  const admDate = record.dateOfAdmission
    ? new Date(record.dateOfAdmission).toLocaleDateString()
    : null;
  const dischargeDate = record.dischargeDate
    ? new Date(record.dischargeDate as number).toLocaleDateString()
    : null;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm">{record.fullName ?? `Record ${index + 1}`}</p>
          {record.patientCode && (
            <p className="text-xs text-muted-foreground">#{record.patientCode}</p>
          )}
        </div>
        {record.medicalCondition && (
          <span className="shrink-0 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-medium">
            {record.medicalCondition}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
        <FieldRow label="Age" value={record.age} />
        <FieldRow label="Gender" value={record.gender} />
        <FieldRow label="Blood type" value={record.bloodType} />
        <FieldRow label="Admission type" value={record.admissionType} />
        <FieldRow label="Admitted" value={admDate} />
        <FieldRow label="Discharged" value={dischargeDate} />
        <FieldRow label="Doctor" value={record.doctorName} />
        <FieldRow label="Room" value={record.roomNumber as string | number} />
        <FieldRow label="Insurance" value={record.insuranceProvider} />
        <FieldRow label="Billing" value={record.billingAmount !== undefined ? `$${Number(record.billingAmount).toLocaleString()}` : null} />
      </div>

      {(record.medication || record.testResults) && (
        <div className="space-y-1 border-t pt-2 text-xs">
          {record.medication && (
            <div>
              <span className="text-muted-foreground block">Medication</span>
              <span className="font-medium">{record.medication}</span>
            </div>
          )}
          {record.testResults && (
            <div>
              <span className="text-muted-foreground block">Test results</span>
              <span className="font-medium">{record.testResults}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Show a truncated hex snippet of encrypted bytes to prove raw data is not stored */
function EncryptedPreview({ bytes }: { bytes: Uint8Array }) {
  const hex = Array.from(bytes.slice(0, 96))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
  return (
    <div className="rounded-md border bg-slate-950 dark:bg-black p-3 space-y-1.5">
      <p className="flex items-center gap-1 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
        Encrypted blob — {bytes.byteLength.toLocaleString()} bytes on Walrus
        <StandardInsightHoverCard {...DATA_INSIGHTS.encryptedBlob} />
      </p>
      <p className="text-[11px] font-mono text-green-400 leading-relaxed break-all">
        {hex}
        <span className="text-slate-500"> … +{(bytes.byteLength - 96).toLocaleString()} more bytes</span>
      </p>
      <p className="text-[10px] text-slate-500">
        ↑ This is what&apos;s stored on-chain. Without your wallet signing the Seal session key, this cannot be decrypted.
      </p>
    </div>
  );
}

export function OpenRecordFlow({
  shareRequestId,
  walrusBlobId,
  sealPolicyId,
  open,
  onOpenChange,
  onSuccess,
}: OpenRecordFlowProps) {
  const [stepStatus, setStepStatus] = useState<Record<StepId, StepStatus>>({
    download: "idle", session: "idle", decrypt: "idle", save: "idle",
  });
  const [running, setRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [decryptedRecords, setDecryptedRecords] = useState<PatientRecord[] | null>(null);
  const [encryptedPreview, setEncryptedPreview] = useState<Uint8Array | null>(null);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);

  const { decrypt } = useSealDecrypt();

  function setStep(id: StepId, status: StepStatus) {
    setStepStatus((prev) => ({ ...prev, [id]: status }));
  }

  async function run() {
    setRunning(true);
    setErrorMsg(null);
    setDecryptedRecords(null);
    setEncryptedPreview(null);
    setStepStatus({ download: "idle", session: "idle", decrypt: "idle", save: "idle" });

    try {
      // ── Step 1: Download blob ───────────────────────────────────────
      setStep("download", "running");
      const encryptedBytes = await walrusDownload(walrusBlobId);
      setEncryptedPreview(encryptedBytes); // show ciphertext preview immediately
      setStep("download", "done");

      // ── Step 2 + 3: Create session key + decrypt ────────────────────
      setStep("session", "running");
      let decryptedBytes: Uint8Array;
      try {
        decryptedBytes = await decrypt(encryptedBytes, sealPolicyId);
      } catch (err) {
        setStep("session", "error");
        throw err;
      }
      setStep("session", "done");

      setStep("decrypt", "running");
      const plaintext = new TextDecoder().decode(decryptedBytes);
      const records = JSON.parse(plaintext) as PatientRecord[];
      setDecryptedRecords(records);
      setStep("decrypt", "done");

      // ── Step 4: Update backend status ───────────────────────────────
      setStep("save", "running");
      const saveRes = await fetch(`/api/sharing/${shareRequestId}/open-record`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Record decrypted and opened via Seal." }),
      });
      const saveData = await saveRes.json() as { ok: boolean; error?: { message?: string } };
      if (!saveData.ok) throw new Error(saveData.error?.message ?? "Failed to update status.");
      setStep("save", "done");

      toast.success("Record decrypted successfully!");
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unexpected error";
      setErrorMsg(msg);
      toast.error(msg);
      setStepStatus((prev) => {
        const next = { ...prev };
        for (const k of Object.keys(next) as StepId[]) {
          if (next[k] === "running") next[k] = "error";
        }
        return next;
      });
    } finally {
      setRunning(false);
    }
  }

  async function handleImport() {
    if (!decryptedRecords) return;
    setImporting(true);
    try {
      const res = await fetch(`/api/sharing/${shareRequestId}/import-records`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ records: decryptedRecords }),
      });
      const data = await res.json() as { ok: boolean; data?: { importedCount: number }; error?: string };
      if (!data.ok) throw new Error(typeof data.error === "string" ? data.error : "Import failed.");
      toast.success(`${data.data?.importedCount ?? 0} record(s) imported to your hospital.`);
      setImportDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  const allDone = Object.values(stepStatus).every((s) => s === "done");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Open Encrypted Record
          </DialogTitle>
          <DialogDescription>
            Download from Walrus and decrypt with your Sui wallet via Seal key servers.
          </DialogDescription>
        </DialogHeader>

        {/* Progress steps — hidden after success */}
        {!decryptedRecords && (
          <div className="divide-y py-1">
            {STEPS.map((step) => (
              <StepRow key={step.id} label={step.label} status={stepStatus[step.id]} insight={step.insight} />
            ))}
          </div>
        )}

        {/* Encrypted ciphertext preview — shown once downloaded, before decrypt */}
        {encryptedPreview && !decryptedRecords && (
          <EncryptedPreview bytes={encryptedPreview} />
        )}

        {errorMsg && (
          <p className="text-xs text-destructive rounded-md bg-destructive/10 px-3 py-2">
            {errorMsg}
          </p>
        )}

        {/* Decrypted records */}
        {decryptedRecords && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Decryption successful — {decryptedRecords.length} patient record(s) retrieved
              </span>
              <StandardInsightHoverCard {...DATA_INSIGHTS.decryptedRecords} />
            </div>
            <p className="text-xs text-muted-foreground">
              Securely decrypted using your Sui wallet and the Seal key servers.
            </p>
            <Separator />
            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
              {decryptedRecords.map((record, i) => (
                <RecordCard key={i} record={record} index={i} />
              ))}
            </div>

            {/* Import button */}
            <div className="rounded-md border bg-muted/30 p-3 space-y-2">
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                Save these records directly to your hospital&apos;s database for future reference.
                <StandardInsightHoverCard {...DATA_INSIGHTS.importRecords} />
              </p>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={handleImport}
                disabled={importing || importDone}
              >
                {importing ? (
                  <><LoaderCircle className="h-4 w-4 animate-spin" />Importing…</>
                ) : importDone ? (
                  <><CheckCircle2 className="h-4 w-4 text-green-500" />Imported to My Hospital</>
                ) : (
                  <><DatabaseZap className="h-4 w-4" />Import Records to My Hospital</>
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {!allDone && (
            <Button className="flex-1" onClick={run} disabled={running}>
              {running ? (
                <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Decrypting…</>
              ) : errorMsg ? (
                "Retry"
              ) : (
                "Open & Decrypt"
              )}
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={running}>
            {allDone ? "Close" : "Cancel"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
