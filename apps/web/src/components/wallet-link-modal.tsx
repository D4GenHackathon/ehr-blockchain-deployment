"use client";

import {
  useCurrentAccount,
  useDisconnectWallet,
  useSignPersonalMessage,
  ConnectModal,
} from "@mysten/dapp-kit";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, AlertTriangle, Wallet, Unlink, RefreshCw, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useWalletStatus, useUnlinkWallet } from "@/hooks/use-wallet-status";

function truncateAddress(address: string) {
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

interface WalletLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletLinkModal({ open, onOpenChange }: WalletLinkModalProps) {
  const account = useCurrentAccount();
  const { mutate: disconnectWallet } = useDisconnectWallet();
  const { mutate: signPersonalMessage } = useSignPersonalMessage();
  const { data: walletStatus, isLoading: statusLoading } = useWalletStatus();
  const { mutate: unlinkWallet, isPending: unlinking } = useUnlinkWallet();
  const queryClient = useQueryClient();

  const [isSigning, setIsSigning] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);

  const connectedAddress = account?.address?.toLowerCase() ?? null;
  const linkedAddress = walletStatus?.address ?? null;

  // Compute current state
  type ModalState = "loading" | "not_connected" | "connected_not_linked" | "linked_match" | "linked_mismatch" | "linked_no_wallet";
  const state: ModalState = statusLoading
    ? "loading"
    : !connectedAddress && !linkedAddress
    ? "not_connected"
    : connectedAddress && !linkedAddress
    ? "connected_not_linked"
    : linkedAddress && connectedAddress === linkedAddress
    ? "linked_match"
    : linkedAddress && connectedAddress && connectedAddress !== linkedAddress
    ? "linked_mismatch"
    : "linked_no_wallet";

  async function handleLinkWallet() {
    if (!connectedAddress) return;
    setIsSigning(true);
    try {
      // 1. Get nonce from server
      const nonceRes = await fetch("/api/wallet/nonce", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: connectedAddress }),
      });
      const nonceData = await nonceRes.json() as { ok: boolean; message?: string; error?: string };
      if (!nonceData.ok) {
        toast.error(nonceData.error === "ADDRESS_TAKEN"
          ? "This wallet is already linked to another account."
          : "Failed to generate nonce. Please try again.");
        return;
      }

      // 2. Sign the message with wallet
      signPersonalMessage(
        { message: new TextEncoder().encode(nonceData.message) },
        {
          onSuccess: async ({ signature }) => {
            // 3. Submit to server for verification
            const linkRes = await fetch("/api/wallet/link", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ address: connectedAddress, signature }),
            });
            const linkData = await linkRes.json() as { ok: boolean; error?: string; message?: string };
            if (linkData.ok) {
              toast.success("Wallet linked successfully!");
              void queryClient.invalidateQueries({ queryKey: ["walletStatus"] });
            } else {
              toast.error(linkData.message ?? "Failed to link wallet.");
            }
            setIsSigning(false);
          },
          onError: (err) => {
            toast.error("Signing cancelled or failed.");
            console.error(err);
            setIsSigning(false);
          },
        }
      );
    } catch (err) {
      console.error(err);
      toast.error("Unexpected error. Please try again.");
      setIsSigning(false);
    }
  }

  function handleUnlink() {
    unlinkWallet(undefined, {
      onSuccess: () => toast.success("Wallet unlinked."),
      onError: () => toast.error("Failed to unlink wallet."),
    });
  }

  function handleRelinkWithCurrent() {
    // Unlink first, then immediately trigger link flow
    unlinkWallet(undefined, {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ["walletStatus"] }).then(() => {
          void handleLinkWallet();
        });
      },
      onError: () => toast.error("Failed to unlink wallet."),
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Sui Wallet
            </DialogTitle>
            <DialogDescription>
              Link your personal Sui wallet to sign transactions on behalf of your hospital.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {state === "loading" && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-4 justify-center">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading wallet status...
              </div>
            )}

            {state === "not_connected" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Connect your Sui wallet to link it to your account.
                </p>
                <Button className="w-full" onClick={() => setConnectModalOpen(true)}>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </Button>
              </div>
            )}

            {state === "connected_not_linked" && (
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/40 px-4 py-3 space-y-1">
                  <p className="text-xs text-muted-foreground">Connected (not linked)</p>
                  <p className="font-mono text-sm font-medium">{connectedAddress && truncateAddress(connectedAddress)}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Sign a message to prove ownership and link this wallet to your account.
                </p>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleLinkWallet} disabled={isSigning}>
                    {isSigning ? (
                      <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Signing…</>
                    ) : (
                      <><CheckCircle2 className="mr-2 h-4 w-4" />Link this wallet</>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => disconnectWallet()}>
                    Disconnect
                  </Button>
                </div>
              </div>
            )}

            {state === "linked_match" && (
              <div className="space-y-4">
                <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 px-4 py-3 space-y-1">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <p className="text-xs font-medium">Linked & connected</p>
                  </div>
                  <p className="font-mono text-sm font-medium">{linkedAddress && truncateAddress(linkedAddress)}</p>
                  {walletStatus?.linkedAt && (
                    <p className="text-xs text-muted-foreground">
                      Linked {new Date(walletStatus.linkedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <a
                  href={`https://testnet.suivision.xyz/account/${linkedAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  View on Sui Explorer <ExternalLink className="h-3 w-3" />
                </a>
                <Separator />
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={handleUnlink}
                  disabled={unlinking}
                >
                  <Unlink className="mr-2 h-4 w-4" />
                  {unlinking ? "Unlinking…" : "Unlink Wallet"}
                </Button>
              </div>
            )}

            {state === "linked_mismatch" && (
              <div className="space-y-4">
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900 px-4 py-3 space-y-3">
                  <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                    <AlertTriangle className="h-4 w-4" />
                    <p className="text-xs font-medium">Wrong wallet connected</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Connected</p>
                    <p className="font-mono text-sm">{connectedAddress && truncateAddress(connectedAddress)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Linked to your account</p>
                    <p className="font-mono text-sm font-medium">{linkedAddress && truncateAddress(linkedAddress)}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Switch to your linked wallet, or re-link with the currently connected one.
                </p>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" onClick={() => disconnectWallet()}>
                    Disconnect & switch wallet
                  </Button>
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={handleRelinkWithCurrent}
                    disabled={isSigning || unlinking}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Re-link with current wallet
                  </Button>
                </div>
              </div>
            )}

            {state === "linked_no_wallet" && (
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/40 px-4 py-3 space-y-1">
                  <p className="text-xs text-muted-foreground">Linked wallet</p>
                  <p className="font-mono text-sm font-medium">{linkedAddress && truncateAddress(linkedAddress)}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Connect your linked wallet to perform signing operations.
                </p>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => setConnectModalOpen(true)}>
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect Wallet
                  </Button>
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={handleUnlink}
                    disabled={unlinking}
                  >
                    <Unlink className="mr-2 h-4 w-4" />
                    Unlink
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* dApp Kit connect modal */}
      <ConnectModal
        trigger={<span />}
        open={connectModalOpen}
        onOpenChange={setConnectModalOpen}
      />
    </>
  );
}
