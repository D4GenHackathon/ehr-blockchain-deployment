"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface WalletStatus {
  linked: boolean;
  address: string | null;
  linkedAt: number | null;
}

async function fetchWalletStatus(): Promise<WalletStatus> {
  const res = await fetch("/api/wallet/status");
  if (!res.ok) throw new Error("Failed to fetch wallet status");
  const data = await res.json() as { ok: boolean; linked: boolean; address: string | null; linkedAt: number | null };
  return { linked: data.linked, address: data.address, linkedAt: data.linkedAt };
}

export function useWalletStatus() {
  return useQuery({
    queryKey: ["walletStatus"],
    queryFn: fetchWalletStatus,
    staleTime: 30_000,
    retry: false,
  });
}

export function useUnlinkWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/wallet/link", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to unlink wallet");
      return res.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["walletStatus"] });
    },
  });
}
