import { notFound } from "next/navigation";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { patientRecords } from "@/db/schema";
import { requireAuthSession } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString();
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

export default async function RecordDetailPage({ params }: Params) {
  const session = await requireAuthSession();
  if (!session) {
    notFound();
  }
  const hospitalId = session.hospitalId;
  if (!hospitalId) {
    notFound();
  }

  const { id } = await params;
  const [record] = await db
    .select()
    .from(patientRecords)
    .where(and(eq(patientRecords.id, id), eq(patientRecords.hospitalId, hospitalId)))
    .limit(1);

  if (!record) {
    notFound();
  }

  return (
    <div className="px-4 lg:px-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/records">Back to records</Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{record.fullName}</h1>
          <p className="text-muted-foreground">
            {record.patientCode} - {record.gender}, {record.age} years old
          </p>
        </div>
        <Badge>{record.status}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Clinical Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Condition:</span> {record.medicalCondition}
            </p>
            <p>
              <span className="text-muted-foreground">Medication:</span> {record.medication}
            </p>
            <p>
              <span className="text-muted-foreground">Test Results:</span> {record.testResults}
            </p>
            <p>
              <span className="text-muted-foreground">Doctor:</span> {record.doctorName}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admission & Billing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Admission Type:</span> {record.admissionType}
            </p>
            <p>
              <span className="text-muted-foreground">Date of Admission:</span>{" "}
              {formatDate(record.dateOfAdmission)}
            </p>
            <p>
              <span className="text-muted-foreground">Discharge Date:</span>{" "}
              {formatDate(record.dischargeDate)}
            </p>
            <p>
              <span className="text-muted-foreground">Room Number:</span> {record.roomNumber}
            </p>
            <p>
              <span className="text-muted-foreground">Insurance:</span> {record.insuranceProvider}
            </p>
            <p>
              <span className="text-muted-foreground">Billing Amount:</span>{" "}
              {formatCurrency(record.billingAmount)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
