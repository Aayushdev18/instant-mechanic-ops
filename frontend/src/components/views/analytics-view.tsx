"use client";

import { AppShell } from "@/components/app-shell";
import { DashboardCharts } from "@/components/dashboard-charts";
import { ErrorState } from "@/components/states";
import { useApiQuery } from "@/lib/use-api-query";
import type { DashboardPayload } from "@/lib/types";

export function AnalyticsView({ initial }: { initial: DashboardPayload }) {
  const { data, error, reload } = useApiQuery<DashboardPayload>("/api/dashboard", initial);
  const view = data ?? initial;

  return (
    <AppShell
      title="Analytics"
      description="Booking volume, revenue, status mix, and service-line mix."
    >
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      <DashboardCharts charts={view.charts} />
    </AppShell>
  );
}
