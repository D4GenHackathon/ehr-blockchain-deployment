import { Badge } from "@/components/ui/badge";
import type { ShareStatus } from "@/types/sharing";

const statusStyles: Record<ShareStatus, "outline" | "secondary" | "destructive" | "default"> = {
  pending: "outline",
  approved: "secondary",
  rejected: "destructive",
  shared: "default",
  expired: "destructive",
};

export function ShareStatusBadge({ status }: { status: ShareStatus }) {
  return <Badge variant={statusStyles[status]}>{status}</Badge>;
}
