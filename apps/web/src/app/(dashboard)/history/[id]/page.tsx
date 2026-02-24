import Link from "next/link";
import { and, eq } from "drizzle-orm";
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
        </CardContent>
      </Card>
    </div>
  );
}
