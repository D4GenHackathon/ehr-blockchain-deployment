import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { activityLogs } from "@/db/schema";
import { requireAuthSession } from "@/lib/auth";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  type: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Not authenticated." } },
      { status: 401 }
    );
  }
  const hospitalId = session.hospitalId;
  if (!hospitalId) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Invalid session." } },
      { status: 401 }
    );
  }

  const parsed = querySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries())
  );
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_QUERY", message: parsed.error.message } },
      { status: 400 }
    );
  }

  const { page, pageSize, type } = parsed.data;
  const offset = (page - 1) * pageSize;

  const filters = [eq(activityLogs.hospitalId, hospitalId)];
  if (type) filters.push(eq(activityLogs.type, type));

  const items = await db
    .select()
    .from(activityLogs)
    .where(and(...filters))
    .orderBy(desc(activityLogs.createdAt))
    .limit(pageSize)
    .offset(offset);

  return NextResponse.json({
    ok: true,
    data: {
      items,
      pagination: { page, pageSize },
    },
  });
}
