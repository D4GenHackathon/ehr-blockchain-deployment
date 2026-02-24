import Link from "next/link";
import { desc, eq } from "drizzle-orm";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { activityLogs } from "@/db/schema";
import { requireAuthSession } from "@/lib/auth";

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString();
}

export default async function HistoryPage() {
  const session = await requireAuthSession();
  if (!session) return null;
  const hospitalId = session.hospitalId;
  if (!hospitalId) return null;

  const items = await db
    .select()
    .from(activityLogs)
    .where(eq(activityLogs.hospitalId, hospitalId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(100);

  return (
    <div className="px-4 lg:px-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Exchange History</h1>
        <p className="text-muted-foreground">
          Timeline of records, sharing requests, and verification activity.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>Showing up to 100 latest activities.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            items.map((item) => (
              <Link
                key={item.id}
                href={`/history/${item.id}`}
                className="block rounded-md border p-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.type.split("_").join(" ")} · {formatDate(item.createdAt)}
                    </p>
                  </div>
                  <Badge variant="outline">{item.relatedEntityType}</Badge>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
