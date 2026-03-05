import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { activityLogs } from "@/db/schema";
import { requireAuthSession } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString();
}

function parseMetadata(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return parsed;
  } catch {
    return null;
  }
}

export default async function HistoryDetailPage({ params }: Params) {
  const session = await requireAuthSession();
  if (!session) return null;
  const hospitalId = session.hospitalId;
  if (!hospitalId) return null;

  const { id } = await params;
  const [item] = await db
    .select()
    .from(activityLogs)
    .where(and(eq(activityLogs.id, id), eq(activityLogs.hospitalId, hospitalId)))
    .limit(1);

  if (!item) notFound();

  const metadata = parseMetadata(item.metadata);
  const timeline = await db
    .select()
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.hospitalId, hospitalId),
        eq(activityLogs.relatedEntityType, item.relatedEntityType),
        eq(activityLogs.relatedEntityId, item.relatedEntityId)
      )
    )
    .orderBy(asc(activityLogs.createdAt));

  return (
    <div className="px-4 lg:px-6 space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/history">Back to history</Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{formatDate(item.createdAt)}</CardDescription>
            </div>
            <Badge>{item.type}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="text-muted-foreground">Related Type:</span> {item.relatedEntityType}
          </p>
          <p>
            <span className="text-muted-foreground">Related ID:</span>{" "}
            <code className="rounded bg-muted px-1.5 py-0.5">{item.relatedEntityId}</code>
          </p>
          {metadata ? (
            <div className="space-y-2">
              <p className="text-muted-foreground">Metadata</p>
              <pre className="overflow-x-auto rounded-md border bg-muted/30 p-3 text-xs">
                {JSON.stringify(metadata, null, 2)}
              </pre>
            </div>
          ) : null}
          {timeline.length > 1 ? (
            <div className="space-y-2">
              <p className="text-muted-foreground">Timeline</p>
              <div className="rounded-md border p-3 space-y-2">
                {timeline.map((entry) => (
                  <div key={entry.id} className="flex items-start justify-between gap-3 text-xs">
                    <div>
                      <p className="font-medium text-foreground">{entry.title}</p>
                      <p className="text-muted-foreground">{entry.type}</p>
                    </div>
                    <p className="text-muted-foreground">{formatDate(entry.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
