"use client";

import { LoaderCircle, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type HospitalOption = { id: string; name: string; code: string };
type RecordOption = { id: string; patientCode: string; fullName: string; medicalCondition: string };

type Props = {
  hospitals: HospitalOption[];
  records: RecordOption[];
  onCreated: () => Promise<void> | void;
};

export function NewShareRequestDialog({ hospitals, records, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [toHospitalId, setToHospitalId] = useState<string>("");
  const [purpose, setPurpose] = useState("");
  const [message, setMessage] = useState("");
  const [expiresDate, setExpiresDate] = useState("");
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => toHospitalId.length > 0 && purpose.trim().length >= 3 && selectedRecordIds.length > 0,
    [purpose, selectedRecordIds.length, toHospitalId.length]
  );

  function toggleRecord(id: string) {
    setSelectedRecordIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/sharing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toHospitalId,
          purpose: purpose.trim(),
          message: message.trim() ? message.trim() : null,
          patientRecordIds: selectedRecordIds,
          expiresAt: expiresDate ? new Date(expiresDate).getTime() : null,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        setError(data?.error?.message ?? "Could not create share request.");
        return;
      }
      setOpen(false);
      setToHospitalId("");
      setPurpose("");
      setMessage("");
      setExpiresDate("");
      setSelectedRecordIds([]);
      await onCreated();
    } catch {
      setError("Could not create share request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          New Share Request
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Data Sharing Request</DialogTitle>
          <DialogDescription>
            Select target hospital and patient records to package for Walrus + Seal flow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Target hospital</p>
            <Select value={toHospitalId} onValueChange={setToHospitalId}>
              <SelectTrigger className="w-full cursor-pointer">
                <SelectValue placeholder="Choose hospital" />
              </SelectTrigger>
              <SelectContent>
                {hospitals.map((hospital) => (
                  <SelectItem key={hospital.id} value={hospital.id}>
                    {hospital.name} ({hospital.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Purpose</p>
            <Input
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              placeholder="Treatment collaboration for cardiology case..."
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Message (optional)</p>
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Any context for receiver hospital..."
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Expiry date (optional)</p>
            <Input type="date" value={expiresDate} onChange={(event) => setExpiresDate(event.target.value)} />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Patient records ({selectedRecordIds.length} selected)</p>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-3">
              {records.length === 0 ? (
                <p className="text-sm text-muted-foreground">No records available for sharing.</p>
              ) : (
                records.map((record) => {
                  const checked = selectedRecordIds.includes(record.id);
                  return (
                    <label
                      key={record.id}
                      className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-muted/50"
                    >
                      <Checkbox checked={checked} onCheckedChange={() => toggleRecord(record.id)} />
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">
                          {record.fullName} · {record.patientCode}
                        </p>
                        <p className="text-xs text-muted-foreground">{record.medicalCondition}</p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button disabled={!canSubmit || isSubmitting} onClick={handleSubmit} className="cursor-pointer">
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Creating...
              </span>
            ) : (
              "Create Request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
