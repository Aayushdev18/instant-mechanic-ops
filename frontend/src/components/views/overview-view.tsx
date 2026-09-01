"use client";

import { AppShell } from "@/components/app-shell";
import { DashboardCharts } from "@/components/dashboard-charts";
import { MechanicMap } from "@/components/mechanic-map";
import { StatusBadge } from "@/components/status-badge";
import { ErrorState, KpiCard } from "@/components/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiQuery } from "@/lib/use-api-query";
import { compact, formatWhen, inr } from "@/lib/format";
import type { DashboardPayload } from "@/lib/types";
import Link from "next/link";

export function OverviewView({ initial }: { initial: DashboardPayload }) {
  const { data, error, reload } = useApiQuery<DashboardPayload>("/api/dashboard", initial);
  const view = data ?? initial;

  return (
    <AppShell
      title="Overview"
      description="Today’s service operations across bookings, mechanics, and revenue."
    >
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard stat="totalBookings" label="Total bookings" value={compact(view.kpis.totalBookings)} hint="All time in the ops window" />
          <KpiCard stat="todaysBookings" label="Today’s bookings" value={String(view.kpis.todaysBookings)} accent />
          <KpiCard stat="completedBookings" label="Completed" value={compact(view.kpis.completedBookings)} />
          <KpiCard stat="pendingBookings" label="Pending / in flight" value={String(view.kpis.pendingBookings)} hint="Pending, assigned, on the way, in progress" />
          <KpiCard stat="cancelledBookings" label="Cancelled" value={String(view.kpis.cancelledBookings)} />
          <KpiCard stat="totalRevenue" label="Total revenue" value={inr(view.kpis.totalRevenue)} hint="Excludes cancelled jobs" accent />
          <KpiCard stat="activeMechanics" label="Active mechanics" value={String(view.kpis.activeMechanics)} hint="Available or currently on a job" />
          <KpiCard stat="newCustomers" label="New customers" value={String(view.kpis.newCustomers)} hint="Last 30 days" />
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <DashboardCharts charts={view.charts} />
          </div>
          <div className="space-y-4">
            <MechanicMap mechanics={view.mechanics} />
            <Card>
              <CardHeader>
                <CardTitle>Live activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {view.recentBookings.map((b) => (
                  <Link
                    key={b.id}
                    href={`/bookings/${b.id}`}
                    className="flex items-start justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    data-booking-id={b.id}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{b.customer.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {b.service.name} · {b.vehicle.label}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatWhen(b.updatedAt)}</p>
                    </div>
                    <StatusBadge status={b.status} />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
