import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { activityLogs, dataShareRequests, patientRecords, zkpExchanges } from "@/db/schema";
import { requireAuthSession } from "@/lib/auth";
import { DashboardCharts } from "./components/dashboard-charts";
import { DashboardStats } from "./components/dashboard-stats";
import { RecentActivity } from "./components/recent-activity";

function monthBucket(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function toMonthLabel(bucket: string) {
  const [year, month] = bucket.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export default async function DashboardPage() {
  const session = await requireAuthSession();
  if (!session) return null;

  const hospitalId = session.hospitalId;

  const [recordTotals] = await db
    .select({
      totalRecords: sql<number>`count(*)`,
      activePatients: sql<number>`sum(case when ${patientRecords.status} = 'active' then 1 else 0 end)`,
    })
    .from(patientRecords)
    .where(eq(patientRecords.hospitalId, hospitalId));

  const [pendingSharesCount] = await db
    .select({ value: sql<number>`count(*)` })
    .from(dataShareRequests)
    .where(
      and(eq(dataShareRequests.toHospitalId, hospitalId), eq(dataShareRequests.status, "pending"))
    );

  const [verifiedProofsCount] = await db
    .select({ value: sql<number>`count(*)` })
    .from(zkpExchanges)
    .where(eq(zkpExchanges.status, "verified"));

  const conditionBreakdown = await db
    .select({
      medicalCondition: patientRecords.medicalCondition,
      total: sql<number>`count(*)`,
    })
    .from(patientRecords)
    .where(eq(patientRecords.hospitalId, hospitalId))
    .groupBy(patientRecords.medicalCondition);

  const admissions = await db
    .select({
      dateOfAdmission: patientRecords.dateOfAdmission,
    })
    .from(patientRecords)
    .where(eq(patientRecords.hospitalId, hospitalId));

  const maxAdmissionTimestamp = admissions.reduce(
    (max, item) => Math.max(max, item.dateOfAdmission),
    0
  );

  const referenceDate = maxAdmissionTimestamp > 0 ? new Date(maxAdmissionTimestamp) : new Date();
  referenceDate.setDate(1);
  referenceDate.setHours(0, 0, 0, 0);

  const windowStart = addMonths(referenceDate, -5);
  const buckets = new Map<string, number>();

  for (let i = 0; i < 6; i += 1) {
    const monthDate = addMonths(windowStart, i);
    buckets.set(monthBucket(monthDate.getTime()), 0);
  }

  for (const item of admissions) {
    if (item.dateOfAdmission < windowStart.getTime() || item.dateOfAdmission > addMonths(referenceDate, 1).getTime()) {
      continue;
    }
    const bucket = monthBucket(item.dateOfAdmission);
    if (!buckets.has(bucket)) continue;
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  }

  const monthlyAdmissions = [...buckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([bucket, count]) => ({
      month: toMonthLabel(bucket),
      admissions: count,
    }));

  const activity = await db
    .select({
      id: activityLogs.id,
      type: activityLogs.type,
      title: activityLogs.title,
      createdAt: activityLogs.createdAt,
    })
    .from(activityLogs)
    .where(eq(activityLogs.hospitalId, hospitalId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(8);

  return (
    <div className="px-4 lg:px-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Hospital Dashboard - {session.hospitalName}
        </h1>
        <p className="text-muted-foreground">
          Live overview for records, selective sharing, and verification activity.
        </p>
      </div>

      <DashboardStats
        stats={{
          totalRecords: recordTotals?.totalRecords ?? 0,
          activePatients: recordTotals?.activePatients ?? 0,
          pendingShares: pendingSharesCount?.value ?? 0,
          verifiedProofs: verifiedProofsCount?.value ?? 0,
        }}
      />

      <DashboardCharts
        monthlyAdmissions={monthlyAdmissions}
        conditionBreakdown={conditionBreakdown}
      />

      <RecentActivity items={activity} />
    </div>
  );
}
