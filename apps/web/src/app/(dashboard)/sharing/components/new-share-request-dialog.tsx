"use client";

import { LoaderCircle, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
// Records are now fetched from the TARGET hospital
type RecordOption = { id: string; patientCode: string; fullName: string; medicalCondition: string };

type Props = {
  hospitals: HospitalOption[];
  // records prop is no longer used — kept for compatibility
  records?: RecordOption[];
  onCreated: () => Promise<void> | void;
};

export function NewShareRequestDialog({ hospitals, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [toHospitalId, setToHospitalId] = useState<string>("");
  const [purpose, setPurpose] = useState("");
  const [message, setMessage] = useState("");
  const [expiresDate, setExpiresDate] = useState("");
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Records of the TARGET hospital
  const [targetRecords, setTargetRecords] = useState<RecordOption[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [recordSearch, setRecordSearch] = useState("");

  // Fetch target hospital's records whenever the selected hospital changes
  useEffect(() => {
    if (!toHospitalId) {
      setTargetRecords([]);
      setSelectedRecordIds([]);
      return;
    }
    setLoadingRecords(true);
    setSelectedRecordIds([]);
    fetch(`/api/sharing/hospitals/${toHospitalId}/records`)
      .then((r) => r.json())
      .then((data: { ok: boolean; data?: { records: RecordOption[] } }) => {
        if (data.ok && data.data) setTargetRecords(data.data.records);
        else setTargetRecords([]);
      })
      .catch(() => setTargetRecords([]))
      .finally(() => setLoadingRecords(false));
  }, [toHospitalId]);

  const filteredRecords = useMemo(() => {
    if (!recordSearch.trim()) return targetRecords;
    const q = recordSearch.toLowerCase();
    return targetRecords.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        r.patientCode.toLowerCase().includes(q) ||
        r.medicalCondition.toLowerCase().includes(q)
    );
  }, [targetRecords, recordSearch]);

  const canSubmit = useMemo(
    () => toHospitalId.length > 0 && purpose.trim().length >= 3 && selectedRecordIds.length > 0,
    [purpose, selectedRecordIds.length, toHospitalId.length]
  );

  function toggleRecord(id: string) {
    setSelectedRecordIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function reset() {
    setToHospitalId("");
    setPurpose("");
    setMessage("");
    setExpiresDate("");
    setSelectedRecordIds([]);
    setTargetRecords([]);
    setRecordSearch("");
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
      reset();
      await onCreated();
    } catch {
      setError("Could not create share request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
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
            Select the source hospital, then choose which of their patient records you want to request access to.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Target hospital */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Source hospital (whose records you want)</p>
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

          {/* Purpose */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Purpose</p>
            <Input
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              placeholder="Treatment collaboration for cardiology case..."
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Message (optional)</p>
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Any context for the receiving hospital..."
            />
          </div>

          {/* Expiry */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Expiry date (optional)</p>
            <Input type="date" value={expiresDate} onChange={(event) => setExpiresDate(event.target.value)} />
          </div>

          {/* Patient records from target hospital */}
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Patient records to request
              {selectedRecordIds.length > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({selectedRecordIds.length} selected)
                </span>
              )}
            </p>

            {!toHospitalId ? (
              <p className="rounded-md border p-3 text-sm text-muted-foreground">
                Select a hospital first to see their patient records.
              </p>
            ) : loadingRecords ? (
              <div className="flex items-center gap-2 rounded-md border p-3 text-sm text-muted-foreground">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Loading records...
              </div>
            ) : targetRecords.length === 0 ? (
              <p className="rounded-md border p-3 text-sm text-muted-foreground">
                No records found for this hospital.
              </p>
            ) : (
              <>
                <Input
                  placeholder="Search by name, code, or condition..."
                  value={recordSearch}
                  onChange={(e) => setRecordSearch(e.target.value)}
                  className="text-sm"
                />
                <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-2">
                  {filteredRecords.length === 0 ? (
                    <p className="px-2 py-1 text-sm text-muted-foreground">No matching records.</p>
                  ) : (
                    filteredRecords.map((record) => {
                      const checked = selectedRecordIds.includes(record.id);
                      return (
                        <label
                          key={record.id}
                          className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-muted/50"
                        >
                          <Checkbox checked={checked} onCheckedChange={() => toggleRecord(record.id)} />
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium">
                              {record.fullName}
                              <span className="ml-2 font-normal text-muted-foreground text-xs">
                                #{record.patientCode}
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground">{record.medicalCondition}</p>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </>
            )}
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
