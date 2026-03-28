"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import { AlertTriangle, ExternalLink, Wallet } from "lucide-react";
import { LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { WalletLinkModal } from "@/components/wallet-link-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useWalletStatus } from "@/hooks/use-wallet-status";
import { NewShareRequestDialog } from "./new-share-request-dialog";
import { OpenRecordFlow } from "./open-record-flow";
import { PrepareApproveFlow } from "./prepare-approve-flow";
import { ShareStatusBadge } from "./share-status-badge";

type HospitalOption = { id: string; name: string; code: string };
type RecordOption = { id: string; patientCode: string; fullName: string; medicalCondition: string };

type ShareItem = {
  id: string;
  fromHospitalId: string;
  toHospitalId: string;
  status:
    | "pending"
    | "preparing"
    | "approved"
    | "ready_to_decrypt"
    | "opened"
    | "confirmed"
    | "completed"
    | "rejected"
    | "expired";
  purpose: string;
  message: string | null;
  createdAt: number;
  respondedAt: number | null;
  readyAt: number | null;
  openedAt: number | null;
  confirmedAt: number | null;
  sharedAt: number | null;
  requestMailboxId: string | null;
  requestPublicKey: string | null;
  walrusBlobId: string | null;
  blobSize: number | null;
  storageNodes: string[];
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

const SUI_NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK ?? "testnet";
const WALRUS_NETWORK = "testnet";

function suiTxUrl(digest: string) {
  return `https://suiscan.xyz/${SUI_NETWORK}/tx/${digest}`;
}
function suiObjectUrl(objectId: string) {
  return `https://suiscan.xyz/${SUI_NETWORK}/object/${objectId}`;
}
function walrusBlobUrl(blobId: string) {
  return `https://walruscan.com/${WALRUS_NETWORK}/blob/${blobId}`;
}

function ExplorerLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-mono text-primary hover:underline"
    >
      {label.slice(0, 14)}…{label.slice(-6)}
      <ExternalLink className="h-3 w-3 shrink-0" />
    </a>
  );
}

function ShareMetadata({
  walrusBlobId,
  sealPolicyId,
  suiTxDigest,
  blobSize,
  storageNodes,
  readyAt,
  openedAt,
  confirmedAt,
  sharedAt,
}: {
  walrusBlobId: string | null;
  sealPolicyId: string | null;
  suiTxDigest: string | null;
  blobSize: number | null;
  storageNodes: string[];
  readyAt: number | null;
  openedAt: number | null;
  confirmedAt: number | null;
  sharedAt: number | null;
}) {
  return (
    <div className="rounded-md border bg-muted/30 p-3 text-xs space-y-1.5">
      {walrusBlobId && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground shrink-0">Walrus blob</span>
          <ExplorerLink href={walrusBlobUrl(walrusBlobId)} label={walrusBlobId} />
        </div>
      )}
      {blobSize !== null && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Blob size</span>
          <span>{(blobSize / 1024).toFixed(1)} KB</span>
        </div>
      )}
      {sealPolicyId && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground shrink-0">Seal allowlist</span>
          <ExplorerLink href={suiObjectUrl(sealPolicyId)} label={sealPolicyId} />
        </div>
      )}
      {suiTxDigest && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground shrink-0">Sui tx</span>
          <ExplorerLink href={suiTxUrl(suiTxDigest)} label={suiTxDigest} />
        </div>
      )}
      {storageNodes.length > 0 && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Storage</span>
          <span>{storageNodes.join(", ")}</span>
        </div>
      )}
      {readyAt && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Ready at</span>
          <span>{formatDate(readyAt)}</span>
        </div>
      )}
      {openedAt && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Opened at</span>
          <span>{formatDate(openedAt)}</span>
        </div>
      )}
      {confirmedAt && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Confirmed at</span>
          <span>{formatDate(confirmedAt)}</span>
        </div>
      )}
      {sharedAt && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Completed at</span>
          <span>{formatDate(sharedAt)}</span>
        </div>
      )}
    </div>
  );
}

function stepState(status: ShareItem["status"]) {
  return {
    requestSent: true,
    waitingForA: !["ready_to_decrypt", "opened", "confirmed", "completed", "rejected"].includes(status),
    readyToDecrypt: ["ready_to_decrypt", "opened", "confirmed", "completed"].includes(status),
    completed: ["completed"].includes(status),
  };
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
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  // Real Seal + Walrus flow modals
  const [prepareFlowItem, setPrepareFlowItem] = useState<ShareItem | null>(null);
  const [openRecordFlowItem, setOpenRecordFlowItem] = useState<ShareItem | null>(null);

  // Wallet readiness
  const account = useCurrentAccount();
  const { data: walletStatus } = useWalletStatus();
  const connectedAddress = account?.address?.toLowerCase() ?? null;
  const linkedAddress = walletStatus?.address ?? null;
  const walletReady = !!linkedAddress && connectedAddress === linkedAddress;
  const walletIssue = !linkedAddress ? "not_linked" : connectedAddress !== linkedAddress ? "mismatch" : null;

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

  const actionableIncomingIds = useMemo(
    () => new Set(incoming.filter((item) => ["pending", "preparing"].includes(item.status)).map((item) => item.id)),
    [incoming]
  );

  async function runAction(
    id: string,
    action: "prepare-approve" | "reject" | "open-record" | "confirm-received" | "mark-completed",
    extra?: {
      message?: string;
      walrusBlobId?: string;
      sealPolicyId?: string;
      suiTxDigest?: string;
      blobSize?: number;
      storageNodes?: string[];
    }
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

      {/* Wallet readiness banner */}
      {walletIssue && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
          <p className="text-sm text-yellow-700 dark:text-yellow-300 flex-1">
            {walletIssue === "not_linked"
              ? "Link your Sui wallet to perform sharing operations (Prepare & Approve, Open Record)."
              : "Wrong wallet connected. Connect your linked wallet to perform signing operations."}
          </p>
          <Button size="sm" variant="outline" className="shrink-0 border-yellow-300 dark:border-yellow-700" onClick={() => setWalletModalOpen(true)}>
            <Wallet className="mr-1.5 h-3.5 w-3.5" />
            {walletIssue === "not_linked" ? "Link Wallet" : "Fix Wallet"}
          </Button>
        </div>
      )}

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
                  <div className="rounded-md border p-3 text-xs">
                    <p className="font-medium mb-2">Request Progress</p>
                    {(() => {
                      const state = stepState(item.status);
                      return (
                        <div className="grid gap-1">
                          <p>{state.requestSent ? "✓" : "○"} Request Sent</p>
                          <p>{state.waitingForA ? "…" : "✓"} Waiting for A</p>
                          <p>{state.readyToDecrypt ? "✓" : "○"} Ready to Decrypt</p>
                          <p>{state.completed ? "✓" : "○"} Completed</p>
                        </div>
                      );
                    })()}
                  </div>
                  {item.status === "ready_to_decrypt" ? (
                    <div className="space-y-2 rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">
                        Download from Walrus → Decrypt with Seal → View patient data
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          disabled={!walletReady || !item.walrusBlobId || !item.sealPolicyId}
                          title={
                            !walletReady
                              ? "Link & connect your Sui wallet first"
                              : !item.walrusBlobId
                              ? "No blob ID found — wait for Hospital A to prepare data"
                              : undefined
                          }
                          onClick={() => setOpenRecordFlowItem(item)}
                        >
                          Open & Decrypt
                        </Button>
                        {!walletReady && (
                          <button
                            onClick={() => setWalletModalOpen(true)}
                            className="text-xs text-yellow-600 dark:text-yellow-400 underline"
                          >
                            Wallet required
                          </button>
                        )}
                      </div>
                    </div>
                  ) : null}
                  {item.status === "opened" ? (
                    <div className="space-y-2 rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">Confirm that the decrypted record is valid.</p>
                      <Button
                        size="sm"
                        disabled={actionLoading === `${item.id}:confirm-received`}
                        onClick={() => runAction(item.id, "confirm-received")}
                      >
                        {actionLoading === `${item.id}:confirm-received` ? (
                          <span className="inline-flex items-center gap-2">
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            Confirming...
                          </span>
                        ) : (
                          "Confirm Received"
                        )}
                      </Button>
                    </div>
                  ) : null}
                  {item.status === "confirmed" ? (
                    <div className="space-y-2 rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">
                        Finalize request after requester confirmation.
                      </p>
                      <Button
                        size="sm"
                        disabled={actionLoading === `${item.id}:mark-completed`}
                        onClick={() =>
                          runAction(item.id, "mark-completed", {})
                        }
                      >
                        {actionLoading === `${item.id}:mark-completed` ? (
                          <span className="inline-flex items-center gap-2">
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            Finalizing...
                          </span>
                        ) : (
                          "Mark Completed"
                        )}
                      </Button>
                    </div>
                  ) : null}
                  {(item.walrusBlobId || item.sealPolicyId || item.suiTxDigest) ? (
                    <ShareMetadata
                      walrusBlobId={item.walrusBlobId}
                      sealPolicyId={item.sealPolicyId}
                      suiTxDigest={item.suiTxDigest}
                      blobSize={item.blobSize}
                      storageNodes={item.storageNodes}
                      readyAt={item.readyAt}
                      openedAt={item.openedAt}
                      confirmedAt={item.confirmedAt}
                      sharedAt={item.sharedAt}
                    />
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
                  {actionableIncomingIds.has(item.id) ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        onClick={() => setPrepareFlowItem(item)}
                        disabled={!walletReady}
                        title={!walletReady ? "Link & connect your Sui wallet first" : undefined}
                      >
                        Prepare & Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => runAction(item.id, "reject")}
                        disabled={actionLoading === `${item.id}:reject`}
                      >
                        {actionLoading === `${item.id}:reject` ? "Rejecting..." : "Reject"}
                      </Button>
                      {!walletReady && (
                        <button
                          onClick={() => setWalletModalOpen(true)}
                          className="text-xs text-yellow-600 dark:text-yellow-400 underline"
                        >
                          Wallet required
                        </button>
                      )}
                    </div>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    Responded: {formatDate(item.respondedAt)}{" "}
                    {item.status === "ready_to_decrypt" ? `· Ready ${formatDate(item.readyAt)}` : ""}
                    {item.status === "opened" || item.status === "confirmed" || item.status === "completed"
                      ? `· Opened ${formatDate(item.openedAt)}`
                      : ""}
                    {item.status === "confirmed" || item.status === "completed"
                      ? `· Confirmed ${formatDate(item.confirmedAt)}`
                      : ""}
                    {item.status === "completed" ? `· Completed ${formatDate(item.sharedAt)}` : ""}
                  </p>
                  {(item.walrusBlobId || item.sealPolicyId || item.suiTxDigest) ? (
                    <ShareMetadata
                      walrusBlobId={item.walrusBlobId}
                      sealPolicyId={item.sealPolicyId}
                      suiTxDigest={item.suiTxDigest}
                      blobSize={item.blobSize}
                      storageNodes={item.storageNodes}
                      readyAt={item.readyAt}
                      openedAt={item.openedAt}
                      confirmedAt={item.confirmedAt}
                      sharedAt={item.sharedAt}
                    />
                  ) : null}
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

      <WalletLinkModal open={walletModalOpen} onOpenChange={setWalletModalOpen} />

      {/* Prepare & Approve — real Seal + Walrus flow */}
      {prepareFlowItem && (
        <PrepareApproveFlow
          shareRequestId={prepareFlowItem.id}
          open={!!prepareFlowItem}
          onOpenChange={(o) => { if (!o) setPrepareFlowItem(null); }}
          onSuccess={() => { void fetchData(); setPrepareFlowItem(null); }}
        />
      )}

      {/* Open Record — real Walrus download + Seal decrypt */}
      {openRecordFlowItem && openRecordFlowItem.walrusBlobId && openRecordFlowItem.sealPolicyId && (
        <OpenRecordFlow
          shareRequestId={openRecordFlowItem.id}
          walrusBlobId={openRecordFlowItem.walrusBlobId}
          sealPolicyId={openRecordFlowItem.sealPolicyId}
          open={!!openRecordFlowItem}
          onOpenChange={(o) => { if (!o) setOpenRecordFlowItem(null); }}
          onSuccess={() => { void fetchData(); }}
        />
      )}
    </div>
  );
}
