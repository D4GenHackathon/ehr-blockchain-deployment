import { Badge } from "@/components/ui/badge";
import type { ShareStatus } from "@/types/sharing";

const statusStyles: Record<ShareStatus, "outline" | "secondary" | "destructive" | "default"> = {
  pending: "outline",
  preparing: "secondary",
  approved: "secondary",
  ready_to_decrypt: "default",
  opened: "default",
  confirmed: "default",
  completed: "default",
  rejected: "destructive",
  expired: "destructive",
};

export function ShareStatusBadge({ status }: { status: ShareStatus }) {
  return <Badge variant={statusStyles[status]}>{status}</Badge>;
}
