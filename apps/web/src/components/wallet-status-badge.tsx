"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import { CheckCircle2, AlertTriangle, WalletMinimal } from "lucide-react";

import { useWalletStatus } from "@/hooks/use-wallet-status";
import { cn } from "@/lib/utils";

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

interface WalletStatusBadgeProps {
  onClick?: () => void;
  className?: string;
}

export function WalletStatusBadge({ onClick, className }: WalletStatusBadgeProps) {
  const account = useCurrentAccount();
  const { data: walletStatus, isLoading } = useWalletStatus();

  if (isLoading) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted/60 transition-colors",
          className
        )}
      >
        <WalletMinimal className="h-3.5 w-3.5" />
        <span>Wallet</span>
      </button>
    );
  }

  const connectedAddress = account?.address?.toLowerCase() ?? null;
  const linkedAddress = walletStatus?.address ?? null;

  if (!linkedAddress) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-950/30 transition-colors",
          className
        )}
        title="No wallet linked"
      >
        <WalletMinimal className="h-3.5 w-3.5" />
        <span>Link wallet</span>
      </button>
    );
  }

  if (connectedAddress && connectedAddress !== linkedAddress) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors",
          className
        )}
        title={`Wrong wallet: connected ${truncateAddress(connectedAddress)}, linked ${truncateAddress(linkedAddress)}`}
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        <span>Wrong wallet</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors",
        className
      )}
      title={`Linked: ${linkedAddress}`}
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      <span>{truncateAddress(linkedAddress)}</span>
    </button>
  );
}
