"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RecordFormDialog } from "./components/record-form-dialog";
import { RecordStatusBadge } from "./components/record-status-badge";

type RecordItem = {
  id: string;
  patientCode: string;
  fullName: string;
  age: number;
  gender: "male" | "female" | "other";
  medicalCondition: string;
  doctorName: string;
  admissionType: string;
  status: "active" | "discharged" | "transferred";
  dateOfAdmission: number;
};

type ListResponse = {
  ok: boolean;
  data?: {
    items: RecordItem[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
  };
  error?: { message?: string };
};

const conditionOptions = ["all", "Arthritis", "Asthma", "Cancer", "Diabetes", "Hypertension", "Obesity"];
const statusOptions = ["all", "active", "discharged", "transferred"];
const admissionTypeOptions = ["all", "Elective", "Emergency", "Urgent"];

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString();
}

export default function RecordsPage() {
  const router = useRouter();
  const [items, setItems] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [condition, setCondition] = useState("all");
  const [status, setStatus] = useState("all");
  const [admissionType, setAdmissionType] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (q.trim()) params.set("q", q.trim());
    if (condition !== "all") params.set("medicalCondition", condition);
    if (status !== "all") params.set("status", status);
    if (admissionType !== "all") params.set("admissionType", admissionType);
    return params.toString();
  }, [admissionType, condition, page, pageSize, q, status]);

  async function loadRecords() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/records?${queryString}`, { cache: "no-store" });
      const data = (await response.json()) as ListResponse;
      if (!response.ok || !data.ok || !data.data) {
        setError(data.error?.message ?? "Could not load records.");
        setItems([]);
        setTotal(0);
        return;
      }
      setItems(data.data.items);
      setTotal(data.data.pagination.total);
    } catch {
      setError("Could not load records.");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  return (
    <div className="px-4 lg:px-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Patient Records</h1>
          <p className="text-muted-foreground">Manage and review records in your hospital workspace.</p>
        </div>
        <RecordFormDialog onCreated={loadRecords} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Input
          value={q}
          onChange={(event) => {
            setPage(1);
            setQ(event.target.value);
          }}
          placeholder="Search patient code, name, doctor..."
        />
        <Select
          value={condition}
          onValueChange={(value) => {
            setPage(1);
            setCondition(value);
          }}
        >
          <SelectTrigger className="w-full cursor-pointer">
            <SelectValue placeholder="Condition" />
          </SelectTrigger>
          <SelectContent>
            {conditionOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option === "all" ? "All conditions" : option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(value) => {
            setPage(1);
            setStatus(value);
          }}
        >
          <SelectTrigger className="w-full cursor-pointer">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option === "all" ? "All statuses" : option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={admissionType}
          onValueChange={(value) => {
            setPage(1);
            setAdmissionType(value);
          }}
        >
          <SelectTrigger className="w-full cursor-pointer">
            <SelectValue placeholder="Admission type" />
          </SelectTrigger>
          <SelectContent>
            {admissionTypeOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option === "all" ? "All admissions" : option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Admission</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6}>Loading records...</TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>No records found.</TableCell>
              </TableRow>
            ) : (
              items.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{record.fullName}</span>
                      <span className="text-xs text-muted-foreground">
                        {record.patientCode} - {record.gender}, {record.age}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{record.medicalCondition}</TableCell>
                  <TableCell>{record.doctorName}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{record.admissionType}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(record.dateOfAdmission)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <RecordStatusBadge status={record.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/records/${record.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Showing page {page} of {totalPages} ({total} total records)
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          >
            Next
          </Button>
          <Button size="sm" onClick={() => router.refresh()}>
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}
