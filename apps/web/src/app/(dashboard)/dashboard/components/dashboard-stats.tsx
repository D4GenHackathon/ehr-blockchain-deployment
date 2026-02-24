import { Activity, FileText, Share2, ShieldCheck } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Stats = {
  totalRecords: number;
  activePatients: number;
  pendingShares: number;
  verifiedProofs: number;
};

export function DashboardStats({ stats }: { stats: Stats }) {
  const items = [
    {
      title: "Total Records",
      value: stats.totalRecords,
      description: "All records in your hospital workspace",
      icon: FileText,
    },
    {
      title: "Active Patients",
      value: stats.activePatients,
      description: "Records with active status",
      icon: Activity,
    },
    {
      title: "Pending Shares",
      value: stats.pendingShares,
      description: "Share requests waiting for action",
      icon: Share2,
    },
    {
      title: "ZKP Verified",
      value: stats.verifiedProofs,
      description: "Verified proof exchanges",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.title}>
          <CardHeader className="pb-2">
            <CardDescription>{item.title}</CardDescription>
            <CardTitle className="text-2xl">{item.value.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{item.description}</p>
            <item.icon className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
