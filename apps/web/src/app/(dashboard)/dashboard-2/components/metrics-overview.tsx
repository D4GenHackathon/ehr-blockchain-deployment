"use client"

import {
  TrendingUp,
  TrendingDown,
  Shield,
  Users,
  CheckSquare,
  BarChart3
} from "lucide-react"
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const metrics = [
  {
    title: "Verified Proofs",
    value: "54,230",
    description: "Proofs processed this month",
    change: "+12%",
    trend: "up",
    icon: Shield,
    footer: "Verification throughput improving",
    subfooter: "Last 6-month trend"
  },
  {
    title: "Active Organizations",
    value: "2,350",
    description: "Participants in current pilots",
    change: "+5.2%",
    trend: "up",
    icon: Users,
    footer: "Consortium participation growing",
    subfooter: "Onboarding remains healthy"
  },
  {
    title: "Pending Policy Reviews",
    value: "1,247",
    description: "Requests awaiting approval",
    change: "-2.1%",
    trend: "down",
    icon: CheckSquare,
    footer: "Backlog reduced this cycle",
    subfooter: "Review pipeline needs attention"
  },
  {
    title: "Access Success Rate",
    value: "98.24%",
    description: "Approved secure access attempts",
    change: "+1.3%",
    trend: "up",
    icon: BarChart3,
    footer: "Policy execution remains stable",
    subfooter: "Tracking above target threshold"
  },
]

export function MetricsOverview() {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid gap-4 sm:grid-cols-2 @5xl:grid-cols-4">
      {metrics.map((metric) => {
        const TrendIcon = metric.trend === "up" ? TrendingUp : TrendingDown

        return (
          <Card key={metric.title} className=" cursor-pointer">
            <CardHeader>
              <CardDescription>{metric.title}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {metric.value}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <TrendIcon className="h-4 w-4" />
                  {metric.change}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {metric.footer} <TrendIcon className="size-4" />
              </div>
              <div className="text-muted-foreground">
                {metric.subfooter}
              </div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
