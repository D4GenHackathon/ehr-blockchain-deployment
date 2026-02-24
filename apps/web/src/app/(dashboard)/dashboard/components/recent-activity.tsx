import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ActivityItem = {
  id: string;
  title: string;
  type: string;
  createdAt: number;
};

function relativeTime(timestamp: number) {
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest record, sharing, and proof actions in your workspace</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity yet.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-md border p-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.type.split("_").join(" ")} - {relativeTime(item.createdAt)}
                </p>
              </div>
              <Link href={`/history/${item.id}`} className="text-sm text-primary inline-flex items-center gap-1">
                View
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
