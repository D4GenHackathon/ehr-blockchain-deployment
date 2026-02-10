"use client"

import { useState } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

const proofData = [
  { month: "Jan", proofs: 12500, target: 15000 },
  { month: "Feb", proofs: 18200, target: 15000 },
  { month: "Mar", proofs: 16800, target: 15000 },
  { month: "Apr", proofs: 22400, target: 20000 },
  { month: "May", proofs: 24600, target: 20000 },
  { month: "Jun", proofs: 28200, target: 25000 },
  { month: "Jul", proofs: 31500, target: 25000 },
  { month: "Aug", proofs: 29800, target: 25000 },
  { month: "Sep", proofs: 33200, target: 30000 },
  { month: "Oct", proofs: 35100, target: 30000 },
  { month: "Nov", proofs: 38900, target: 35000 },
  { month: "Dec", proofs: 42300, target: 35000 },
]

const chartConfig = {
  proofs: {
    label: "Proofs",
    color: "var(--primary)",
  },
  target: {
    label: "Target",
    color: "var(--primary)",
  },
}

export function SalesChart() {
  const [timeRange, setTimeRange] = useState("12m")

  return (
    <Card className="cursor-pointer">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Proof Throughput</CardTitle>
          <CardDescription>Monthly proofs processed vs operational targets</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3m" className="cursor-pointer">Last 3 months</SelectItem>
              <SelectItem value="6m" className="cursor-pointer">Last 6 months</SelectItem>
              <SelectItem value="12m" className="cursor-pointer">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="cursor-pointer">
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 pt-6">
        <div className="px-6 pb-6">
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <AreaChart data={proofData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorProofs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-proofs)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--color-proofs)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-target)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--color-target)" stopOpacity={0} />
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
                className="text-xs"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value.toLocaleString()}`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="target"
                stackId="1"
                stroke="var(--color-target)"
                fill="url(#colorTarget)"
                strokeDasharray="5 5"
                strokeWidth={1}
              />
              <Area
                type="monotone"
                dataKey="proofs"
                stackId="2"
                stroke="var(--color-proofs)"
                fill="url(#colorProofs)"
                strokeWidth={1}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
