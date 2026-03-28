"use client";

import { CheckCircle2, Circle, LoaderCircle, ShieldCheck, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useAllowlistOps } from "@/hooks/use-allowlist-ops";
import { useSealEncrypt } from "@/hooks/use-seal-ops";
import { walrusUpload } from "@/lib/walrus-rest";

const STEPS = [
  { id: "fetch", label: "Fetch recipient wallet address" },
  { id: "allowlist", label: "Create access policy on Sui (sign tx)" },
  { id: "add", label: "Grant recipient access (sign tx)" },
  { id: "encrypt", label: "Encrypt patient data with Seal" },
  { id: "upload", label: "Upload to Walrus storage" },
  { id: "save", label: "Save metadata to server" },
] as const;

type StepId = (typeof STEPS)[number]["id"];
type StepStatus = "idle" | "running" | "done" | "error";

interface PatientRecord {
  id: string;
  fullName: string;
  patientCode: string;
  medicalCondition?: string;
  age?: number;
  gender?: string;
  bloodType?: string;
  dateOfAdmission?: number;
  doctorName?: string;
  medication?: string;
  testResults?: string;
  admissionType?: string;
  billingAmount?: number;
  [key: string]: unknown;
}

interface PrepareApproveFlowProps {
  shareRequestId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function StepRow({ label, status }: { label: string; status: StepStatus }) {
  return (
    <div className="flex items-center gap-3 py-2">
      {status === "idle" && <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
      {status === "running" && <LoaderCircle className="h-4 w-4 animate-spin text-primary shrink-0" />}
      {status === "done" && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
      {status === "error" && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
      <span className={`text-sm ${status === "running" ? "font-medium" : status === "done" ? "text-muted-foreground line-through" : ""}`}>
        {label}
      </span>
    </div>
  );
}

export function PrepareApproveFlow({
  shareRequestId,
  open,
  onOpenChange,
  onSuccess,
}: PrepareApproveFlowProps) {
  const [stepStatus, setStepStatus] = useState<Record<StepId, StepStatus>>({
    fetch: "idle", allowlist: "idle", add: "idle", encrypt: "idle", upload: "idle", save: "idle",
  });
  const [running, setRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Records loaded in the "fetch" step shown as preview
  const [previewRecords, setPreviewRecords] = useState<PatientRecord[] | null>(null);
  const [recipientAddress, setRecipientAddress] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const { createAllowlist, addToAllowlist } = useAllowlistOps();
  const { encrypt } = useSealEncrypt();

  // Load preview when modal opens
  useEffect(() => {
    if (!open) return;
    setPreviewRecords(null);
    setRecipientAddress(null);
    setPreviewLoading(true);
    fetch(`/api/sharing/${shareRequestId}`)
      .then((r) => r.json())
      .then((d: { ok: boolean; data?: { records: PatientRecord[]; recipientSuiAddress: string | null } }) => {
        if (d.ok && d.data) {
          setPreviewRecords(d.data.records);
          setRecipientAddress(d.data.recipientSuiAddress);
        }
      })
      .catch(() => {/* ignore preview error */})
      .finally(() => setPreviewLoading(false));
  }, [open, shareRequestId]);

  function setStep(id: StepId, status: StepStatus) {
    setStepStatus((prev) => ({ ...prev, [id]: status }));
  }

  async function run() {
    setRunning(true);
    setErrorMsg(null);
    // Reset
    setStepStatus({ fetch: "idle", allowlist: "idle", add: "idle", encrypt: "idle", upload: "idle", save: "idle" });

    try {
      // ── Step 1: Fetch recipient wallet ──────────────────────────────
      setStep("fetch", "running");
      const infoRes = await fetch(`/api/sharing/${shareRequestId}`);
      const infoData = await infoRes.json() as {
        ok: boolean;
        data?: {
          recipientSuiAddress: string | null;
          records: Array<Record<string, unknown>>;
        };
        error?: string;
      };
      if (!infoData.ok || !infoData.data) throw new Error("Failed to load share request details.");
      const { recipientSuiAddress, records } = infoData.data;
      if (!recipientSuiAddress) {
        throw new Error(
          "Recipient hospital has no linked Sui wallet. Ask them to link their wallet first."
        );
      }
      setStep("fetch", "done");

      // ── Step 2: Create allowlist on Sui ─────────────────────────────
      setStep("allowlist", "running");
      const { allowlistId, capId, txDigest: createTxDigest } = await createAllowlist(
        `EHR-Share-${shareRequestId.slice(0, 8)}`
      );
      setStep("allowlist", "done");

      // ── Step 3: Add recipient to allowlist ──────────────────────────
      setStep("add", "running");
      await addToAllowlist(allowlistId, capId, recipientSuiAddress);
      setStep("add", "done");

      // ── Step 4: Encrypt patient data ────────────────────────────────
      setStep("encrypt", "running");
      const plaintext = new TextEncoder().encode(JSON.stringify(records));
      const { encryptedBytes } = await encrypt(plaintext, allowlistId);
      setStep("encrypt", "done");

      // ── Step 5: Upload to Walrus ─────────────────────────────────────
      setStep("upload", "running");
      const { blobId } = await walrusUpload(encryptedBytes);
      setStep("upload", "done");

      // ── Step 6: Save to backend ──────────────────────────────────────
      setStep("save", "running");
      const saveRes = await fetch(`/api/sharing/${shareRequestId}/prepare-approve`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          walrusBlobId: blobId,
          sealPolicyId: allowlistId,
          suiTxDigest: createTxDigest,
          blobSize: encryptedBytes.byteLength,
          storageNodes: ["Walrus-Testnet"],
          message: "Data prepared and encrypted via Seal + Walrus.",
        }),
      });
      const saveData = await saveRes.json() as { ok: boolean; error?: { message?: string } };
      if (!saveData.ok) throw new Error(saveData.error?.message ?? "Failed to save metadata.");
      setStep("save", "done");

      toast.success("Data prepared, encrypted & uploaded successfully!");
      onSuccess();
      setTimeout(() => onOpenChange(false), 1200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unexpected error";
      setErrorMsg(msg);
      toast.error(msg);
      // Mark current running step as error
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

  const allDone = Object.values(stepStatus).every((s) => s === "done");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Prepare & Approve Data Sharing</DialogTitle>
          <DialogDescription>
            This will encrypt patient data with Seal and upload it to Walrus so the requester can access it.
          </DialogDescription>
        </DialogHeader>

        {/* Records preview */}
        {previewLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <LoaderCircle className="h-4 w-4 animate-spin" /> Loading records…
          </div>
        ) : previewRecords && previewRecords.length > 0 ? (
          <div className="rounded-md border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              <p className="text-xs font-medium">
                {previewRecords.length} record(s) will be encrypted and shared:
              </p>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
              {previewRecords.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-xs py-0.5">
                  <span className="font-medium">{r.fullName}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">#{r.patientCode}</span>
                    {r.medicalCondition && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1">
                        {r.medicalCondition}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {recipientAddress && (
              <p className="text-[10px] text-muted-foreground break-all border-t pt-2">
                Recipient wallet: {recipientAddress}
              </p>
            )}
          </div>
        ) : previewRecords?.length === 0 ? (
          <p className="text-xs text-destructive rounded-md bg-destructive/10 px-3 py-2">
            No patient records found for this request. Cannot proceed.
          </p>
        ) : null}

        <Separator />

        <div className="divide-y py-1">
          {STEPS.map((step) => (
            <StepRow key={step.id} label={step.label} status={stepStatus[step.id]} />
          ))}
        </div>

        {errorMsg && (
          <p className="text-xs text-destructive rounded-md bg-destructive/10 px-3 py-2">
            {errorMsg}
          </p>
        )}

        <div className="flex gap-2 pt-2">
          {!allDone && (
            <Button className="flex-1" onClick={run} disabled={running || previewLoading || previewRecords?.length === 0}>
              {running ? (
                <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Processing…</>
              ) : errorMsg ? (
                "Retry"
              ) : (
                "Start"
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
