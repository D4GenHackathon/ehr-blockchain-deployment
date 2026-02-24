"use client";

import * as React from "react";
import { Area, AreaChart, Cell, CartesianGrid, Label, Pie, PieChart, Sector, XAxis, YAxis } from "recharts";
import type { PieSectorDataItem } from "recharts/types/polar/Pie";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type MonthlyPoint = {
  month: string;
  admissions: number;
};

type ConditionPoint = {
  medicalCondition: string;
  total: number;
};

const monthChartConfig = {
  admissions: {
    label: "Admissions",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

const conditionChartConfig = {
  total: {
    label: "Records",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

const pieColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--primary)",
];

export function DashboardCharts({
  monthlyAdmissions,
  conditionBreakdown,
}: {
  monthlyAdmissions: MonthlyPoint[];
  conditionBreakdown: ConditionPoint[];
}) {
  const conditionChartId = "condition-breakdown";
  const InteractivePie = Pie as unknown as React.ComponentType<Record<string, unknown>>;
  const [monthlyRange, setMonthlyRange] = React.useState<"3m" | "6m" | "12m">("6m");

  const filteredMonthlyAdmissions = React.useMemo(() => {
    if (monthlyRange === "3m") return monthlyAdmissions.slice(-3);
    if (monthlyRange === "6m") return monthlyAdmissions.slice(-6);
    return monthlyAdmissions;
  }, [monthlyAdmissions, monthlyRange]);

  const conditionData = React.useMemo(() => {
    const total = conditionBreakdown.reduce((sum, item) => sum + item.total, 0);
    return conditionBreakdown.map((item, index) => ({
      ...item,
      percentage: total > 0 ? Math.round((item.total / total) * 100) : 0,
      fill: pieColors[index % pieColors.length],
    }));
  }, [conditionBreakdown]);

  const [activeCondition, setActiveCondition] = React.useState(
    conditionData[0]?.medicalCondition ?? ""
  );

  React.useEffect(() => {
    if (!conditionData.length) {
      setActiveCondition("");
      return;
    }
    if (!conditionData.some((item) => item.medicalCondition === activeCondition)) {
      setActiveCondition(conditionData[0].medicalCondition);
    }
  }, [activeCondition, conditionData]);

  const activeConditionIndex = React.useMemo(() => {
    const index = conditionData.findIndex((item) => item.medicalCondition === activeCondition);
    return index === -1 ? 0 : index;
  }, [activeCondition, conditionData]);

  function downloadCsv(filename: string, rows: Array<Record<string, string | number>>) {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) => {
            const value = String(row[header] ?? "");
            if (value.includes(",") || value.includes('"')) {
              return `"${value.split('"').join('""')}"`;
            }
            return value;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function exportMonthlyAdmissions() {
    downloadCsv(
      "monthly-admissions.csv",
      filteredMonthlyAdmissions.map((item) => ({
        month: item.month,
        admissions: item.admissions,
      }))
    );
  }

  function exportConditionDistribution() {
    downloadCsv(
      "condition-distribution.csv",
      conditionData.map((item) => ({
        condition: item.medicalCondition,
        records: item.total,
        percentage: `${item.percentage}%`,
      }))
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Monthly Admissions</CardTitle>
            <CardDescription>Records admitted over the last 6 months</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={monthlyRange} onValueChange={(value) => setMonthlyRange(value as "3m" | "6m" | "12m")}>
              <SelectTrigger className="w-32 cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3m" className="cursor-pointer">
                  Last 3 months
                </SelectItem>
                <SelectItem value="6m" className="cursor-pointer">
                  Last 6 months
                </SelectItem>
                <SelectItem value="12m" className="cursor-pointer">
                  All data
                </SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="cursor-pointer" onClick={exportMonthlyAdmissions}>
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-6">
          <div className="h-[300px] px-6 pb-6 lg:h-[340px]">
            <ChartContainer config={monthChartConfig} className="h-full w-full min-h-0">
              <AreaChart data={filteredMonthlyAdmissions} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAdmissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-admissions)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-admissions)" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                <Area
                  type="monotone"
                  dataKey="admissions"
                  stroke="var(--color-admissions)"
                  fill="url(#colorAdmissions)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      <Card data-chart={conditionChartId} className="flex flex-col cursor-pointer">
        <CardHeader className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-2">
          <div>
            <CardTitle>Condition Distribution</CardTitle>
            <CardDescription>Current records by medical condition</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={activeCondition} onValueChange={setActiveCondition}>
              <SelectTrigger className="w-[190px] rounded-lg cursor-pointer" aria-label="Select condition">
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent align="end" className="rounded-lg">
                {conditionData.map((item) => (
                  <SelectItem
                    key={item.medicalCondition}
                    value={item.medicalCondition}
                    className="rounded-md [&_span]:flex cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                      {item.medicalCondition}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="cursor-pointer" onClick={exportConditionDistribution}>
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            <div className="flex justify-center">
              <ChartContainer
                id={conditionChartId}
                config={conditionChartConfig}
                className="mx-auto aspect-square w-full max-w-[300px]"
              >
                <PieChart>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <InteractivePie
                    data={conditionData}
                    dataKey="total"
                    nameKey="medicalCondition"
                    innerRadius={60}
                    strokeWidth={5}
                    activeIndex={activeConditionIndex}
                    activeShape={({ outerRadius = 0, ...props }: PieSectorDataItem) => (
                      <g>
                        <Sector {...props} outerRadius={outerRadius + 10} />
                        <Sector
                          {...props}
                          outerRadius={outerRadius + 25}
                          innerRadius={outerRadius + 12}
                        />
                      </g>
                    )}
                  >
                    {conditionData.map((entry, index) => {
                      const isActive = index === activeConditionIndex;
                      return (
                        <Cell
                          key={`${entry.medicalCondition}-${entry.total}`}
                          fill={entry.fill}
                          stroke={isActive ? "var(--background)" : "var(--card)"}
                          strokeWidth={2}
                        />
                      );
                    })}
                    <Label
                      content={({ viewBox }) => {
                        if (!viewBox || !("cx" in viewBox) || !conditionData.length) return null;
                        const active = conditionData[activeConditionIndex];
                        return (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-3xl font-bold"
                            >
                              {active.total}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground"
                            >
                              Records
                            </tspan>
                          </text>
                        );
                      }}
                    />
                  </InteractivePie>
                </PieChart>
              </ChartContainer>
            </div>

            <div className="flex flex-col justify-center space-y-2">
              {conditionData.length === 0 ? (
                <p className="text-sm text-muted-foreground">No condition data available.</p>
              ) : (
                conditionData.map((item, index) => {
                  const isActive = item.medicalCondition === activeCondition;
                  return (
                    <div
                      key={item.medicalCondition}
                      className={`flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors cursor-pointer ${
                        isActive ? "bg-muted" : "hover:bg-muted/50"
                      }`}
                      onClick={() => setActiveCondition(item.medicalCondition)}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: item.fill }}
                        />
                        <span className="text-sm">{item.medicalCondition}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">{item.total}</div>
                        <div className="text-xs text-muted-foreground">{item.percentage}%</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
