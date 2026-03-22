import React from "react";
import { Card } from "@/components/ui/card";
import type { ProjectOverviewSnapshot } from "../types";
import { DecisionCard, RouteChoiceStrip, StageStatStrip, SummaryStat } from "./home-fragments";

export function HomeDashboard({ overview }: { overview: ProjectOverviewSnapshot }) {
  return (
    <div className="space-y-6">
      <section id="home-overview">
        <Card className="overflow-hidden">
          <p className="text-xs uppercase tracking-[0.32em] text-accent">{overview.homepage.eyebrow}</p>
          <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-tight">{overview.homepage.headline}</h1>
          <p className="mt-4 max-w-4xl text-lg leading-8 text-white/72">{overview.homepage.subheadline}</p>
          <div className="mt-8 grid gap-4 xl:grid-cols-4">
            {overview.homepage.primaryStats.map((item) => (
              <SummaryStat key={item.label} item={item} />
            ))}
          </div>
          <div className="mt-5">
            <StageStatStrip items={overview.homepage.stageStats} />
          </div>
          <div className="mt-5">
            <DecisionCard item={overview.homepage.decision} />
          </div>
          <div className="mt-5">
            <RouteChoiceStrip items={overview.homepage.routes} />
          </div>
        </Card>
      </section>
    </div>
  );
}
