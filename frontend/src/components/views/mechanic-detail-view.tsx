"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ErrorState } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiQuery } from "@/lib/use-api-query";
import { formatWhen, inr } from "@/lib/format";
import type { Mechanic } from "@/lib/types";

export function MechanicDetailView({ initial }: { initial: Mechanic }) {
  const { data, error, reload } = useApiQuery<Mechanic>(`/api/mechanics/${initial.id}`, initial);
  const mechanic = data ?? initial;

  return (
    <AppShell title={mechanic.name} description="Roster profile and recent jobs.">
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{mechanic.name}</CardTitle>
            <StatusBadge status={mechanic.status} />
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">City</p>
              {mechanic.city}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Specialty</p>
              {mechanic.specialty}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Jobs completed</p>
              {mechanic.jobsCompleted}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rating</p>
              {mechanic.rating.toFixed(1)}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              {mechanic.phone}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active jobs</p>
              {mechanic.stats?.active ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent bookings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(mechanic.bookings || []).map((b) => (
              <Link
                key={b.id}
                href={`/bookings/${b.id}`}
                className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-muted/50"
              >
                <div>
                  <p className="font-medium">{b.id} · {b.customer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.service.name} · {formatWhen(b.scheduledAt)} · {inr(b.amount)}
                  </p>
                </div>
                <StatusBadge status={b.status} />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
