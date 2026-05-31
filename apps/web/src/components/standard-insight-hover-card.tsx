"use client";

import { CircleHelp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export type StandardInsight = {
  title: string;
  standards: readonly string[];
  method: string;
  detail: string;
};

export function StandardInsightHoverCard({
  title,
  standards,
  method,
  detail,
}: StandardInsight) {
  return (
    <HoverCard openDelay={120} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          aria-label={`How ${title} follows EHR standards`}
          className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CircleHelp className="size-3.5" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-80 space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">{title}</p>
          <div className="flex flex-wrap gap-1">
            {standards.map((standard) => (
              <Badge key={standard} variant="outline" className="text-[10px]">
                {standard}
              </Badge>
            ))}
          </div>
        </div>
        <div className="space-y-1 text-xs leading-5">
          <p>
            <span className="font-medium text-foreground">Method:</span>{" "}
            <span className="text-muted-foreground">{method}</span>
          </p>
          <p>
            <span className="font-medium text-foreground">Applied control:</span>{" "}
            <span className="text-muted-foreground">{detail}</span>
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
