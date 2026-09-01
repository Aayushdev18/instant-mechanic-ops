"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState, ErrorState } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiQuery } from "@/lib/use-api-query";
import { formatWhen } from "@/lib/format";
import type { Mechanic } from "@/lib/types";

export function MechanicsView({ initial }: { initial: Mechanic[] }) {
  const { data, error, reload } = useApiQuery<Mechanic[]>("/api/mechanics", initial);
  const list = data ?? initial;

  return (
    <AppShell
      title="Mechanics"
      description="Who is available, who is on a job, and what they last touched."
    >
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {list.length === 0 ? (
        <EmptyState title="No mechanics on roster" body="Seed the database to populate the fleet." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {list.map((m) => (
            <Link key={m.id} href={`/mechanics/${m.id}`}>
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{m.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {m.city} · {m.specialty}
                    </p>
                  </div>
                  <StatusBadge status={m.status} />
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>
                    {m.jobsCompleted} jobs completed · {m.rating.toFixed(1)} rating
                  </p>
                  <p className="mt-2">
                    {m.currentBooking
                      ? `Latest: ${m.currentBooking.id} · ${m.currentBooking.service.name} · ${formatWhen(m.currentBooking.updatedAt)}`
                      : "No recent booking"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
