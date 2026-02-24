"use client";

import { Badge } from "@/components/ui/badge";
import type { RecordStatus } from "@/types/records";

export function RecordStatusBadge({ status }: { status: RecordStatus }) {
  if (status === "active") {
    return <Badge>Active</Badge>;
  }

  if (status === "discharged") {
    return <Badge variant="secondary">Discharged</Badge>;
  }

  return <Badge variant="outline">Transferred</Badge>;
}
