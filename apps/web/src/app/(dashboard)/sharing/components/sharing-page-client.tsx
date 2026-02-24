"use client";

import { LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { NewShareRequestDialog } from "./new-share-request-dialog";
import { ShareStatusBadge } from "./share-status-badge";

type HospitalOption = { id: string; name: string; code: string };
type RecordOption = { id: string; patientCode: string; fullName: string; medicalCondition: string };

type ShareItem = {
  id: string;
  fromHospitalId: string;
  toHospitalId: string;
  status: "pending" | "approved" | "rejected" | "shared" | "expired";
  purpose: string;
  message: string | null;
  createdAt: number;
  respondedAt: number | null;
  sharedAt: number | null;
  walrusBlobId: string | null;
  sealPolicyId: string | null;
  suiTxDigest: string | null;
  patientRecordIds: string[];
  records: Array<{ id: string; patientCode: string; fullName: string }>;
  fromHospital: HospitalOption | null;
  toHospital: HospitalOption | null;
};

type SharingResponse = {
  ok: boolean;
  data?: {
    outgoing: ShareItem[];
    incoming: ShareItem[];
    options: { hospitals: HospitalOption[]; myRecords: RecordOption[] };
  };
  error?: { message?: string };
};

function formatDate(timestamp: number | null) {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleString();
}

export function SharingPageClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [outgoing, setOutgoing] = useState<ShareItem[]>([]);
  const [incoming, setIncoming] = useState<ShareItem[]>([]);
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [myRecords, setMyRecords] = useState<RecordOption[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<Record<string, string>>({});

  const allShareCount = outgoing.length + incoming.length;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/sharing", { cache: "no-store" });
      const data = (await response.json()) as SharingResponse;
      if (!response.ok || !data.ok || !data.data) {
        setError(data.error?.message ?? "Could not load sharing requests.");
        setOutgoing([]);
        setIncoming([]);
        setHospitals([]);
        setMyRecords([]);
        return;
      }
      setOutgoing(data.data.outgoing);
      setIncoming(data.data.incoming);
      setHospitals(data.data.options.hospitals);
      setMyRecords(data.data.options.myRecords);
    } catch {
      setError("Could not load sharing requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const pendingIncomingIds = useMemo(
    () => new Set(incoming.filter((item) => item.status === "pending").map((item) => item.id)),
    [incoming]
  );

  async function runAction(
    id: string,
    action: "approve" | "reject" | "complete",
    extra?: { walrusBlobId?: string; sealPolicyId?: string; suiTxDigest?: string }
  ) {
    setActionLoading(`${id}:${action}`);
    setError(null);
    try {
      const response = await fetch(`/api/sharing/${id}/${action}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: actionMessage[id] || undefined,
          ...extra,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        setError(data?.error?.message ?? "Action failed.");
        return;
      }
      await fetchData();
    } catch {
      setError("Action failed.");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="px-4 lg:px-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Sharing Hub</h1>
          <p className="text-muted-foreground">
            Manage outgoing and incoming requests for full record sharing.
          </p>
        </div>
        <NewShareRequestDialog hospitals={hospitals} records={myRecords} onCreated={fetchData} />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Tabs defaultValue="outgoing" className="space-y-4">
        <TabsList>
          <TabsTrigger value="outgoing">Outgoing ({outgoing.length})</TabsTrigger>
          <TabsTrigger value="incoming">Incoming ({incoming.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="outgoing" className="space-y-3">
          {loading ? (
            <div className="rounded-md border p-4 text-sm text-muted-foreground">Loading outgoing requests...</div>
          ) : outgoing.length === 0 ? (
            <div className="rounded-md border p-4 text-sm text-muted-foreground">No outgoing requests.</div>
          ) : (
            outgoing.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">
                        {item.toHospital?.name ?? "Unknown hospital"}
                      </CardTitle>
                      <CardDescription>{item.purpose}</CardDescription>
                    </div>
                    <ShareStatusBadge status={item.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    {item.records.length} records · Created {formatDate(item.createdAt)}
                  </p>
                  {item.message ? <p>{item.message}</p> : null}
                  <div className="rounded-md border p-3 space-y-1">
                    {item.records.map((record) => (
                      <p key={record.id} className="text-sm">
                        {record.fullName} · {record.patientCode}
                      </p>
                    ))}
                  </div>
                  {item.status === "approved" ? (
                    <div className="space-y-2 rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">
                        Demo complete action (simulate Walrus + Seal + Sui metadata write)
                      </p>
                      <Button
                        size="sm"
                        disabled={actionLoading === `${item.id}:complete`}
                        onClick={() =>
                          runAction(item.id, "complete", {
                            walrusBlobId: `walrus_${item.id.slice(0, 8)}`,
                            sealPolicyId: `seal_${item.id.slice(0, 8)}`,
                            suiTxDigest: `sui_${Date.now()}`,
                          })
                        }
                      >
                        {actionLoading === `${item.id}:complete` ? (
                          <span className="inline-flex items-center gap-2">
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            Completing...
                          </span>
                        ) : (
                          "Mark As Shared"
                        )}
                      </Button>
                    </div>
                  ) : null}
                  {item.status === "shared" ? (
                    <div className="rounded-md border bg-muted/30 p-3 text-xs space-y-1">
                      <p>Walrus blob: {item.walrusBlobId ?? "-"}</p>
                      <p>Seal policy: {item.sealPolicyId ?? "-"}</p>
                      <p>Sui tx: {item.suiTxDigest ?? "-"}</p>
                      <p>Shared at: {formatDate(item.sharedAt)}</p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="incoming" className="space-y-3">
          {loading ? (
            <div className="rounded-md border p-4 text-sm text-muted-foreground">Loading incoming requests...</div>
          ) : incoming.length === 0 ? (
            <div className="rounded-md border p-4 text-sm text-muted-foreground">No incoming requests.</div>
          ) : (
            incoming.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">
                        {item.fromHospital?.name ?? "Unknown hospital"}
                      </CardTitle>
                      <CardDescription>{item.purpose}</CardDescription>
                    </div>
                    <ShareStatusBadge status={item.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    {item.records.length} records · Created {formatDate(item.createdAt)}
                  </p>
                  <div className="rounded-md border p-3 space-y-1">
                    {item.records.map((record) => (
                      <p key={record.id} className="text-sm">
                        {record.fullName} · {record.patientCode}
                      </p>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Response message (optional)</p>
                    <Textarea
                      value={actionMessage[item.id] ?? ""}
                      onChange={(event) =>
                        setActionMessage((prev) => ({ ...prev, [item.id]: event.target.value }))
                      }
                      placeholder="Add context for approval/rejection..."
                    />
                  </div>
                  {pendingIncomingIds.has(item.id) ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => runAction(item.id, "approve")}
                        disabled={actionLoading === `${item.id}:approve`}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => runAction(item.id, "reject")}
                        disabled={actionLoading === `${item.id}:reject`}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    Responded: {formatDate(item.respondedAt)} {item.status === "shared" ? `· Shared ${formatDate(item.sharedAt)}` : ""}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {!loading && allShareCount === 0 ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Start by creating your first sharing request.
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
