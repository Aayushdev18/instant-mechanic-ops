"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ErrorState } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLive } from "@/components/live-provider";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/use-api-query";
import { formatWhen, inr } from "@/lib/format";
import { PIPELINE, STATUS_LABELS } from "@/lib/status";
import type { Booking } from "@/lib/types";
import { useState } from "react";

export function BookingDetailView({ initial }: { initial: Booking }) {
  const { lastBooking } = useLive();
  const [saving, setSaving] = useState(false);
  const { data: booking, error, reload } = useApiQuery<Booking>(`/api/bookings/${initial.id}`, initial);
  const base = booking ?? initial;
  const view =
    lastBooking && lastBooking.id === initial.id ? { ...base, ...lastBooking } : base;

  async function setStatus(status: string) {
    setSaving(true);
    try {
      await api<Booking>(`/api/bookings/${initial.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, note: "Updated from ops console" }),
      });
      reload();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title={view.id} description="Job timeline, assignment, and status control.">
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-3">
              {view.service.name}
              <StatusBadge status={view.status} />
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
            <Field label="Customer">
              <Link className="text-primary hover:underline" href="/customers">
                {view.customer.name}
              </Link>
              <p className="text-muted-foreground">{view.customer.city}</p>
            </Field>
            <Field label="Vehicle">
              {view.vehicle.label}
              <p className="text-muted-foreground">{view.vehicle.plate}</p>
            </Field>
            <Field label="Mechanic">
              {view.mechanic ? (
                <Link className="text-primary hover:underline" href={`/mechanics/${view.mechanic.id}`}>
                  {view.mechanic.name}
                </Link>
              ) : (
                "Unassigned"
              )}
            </Field>
            <Field label="Amount">{inr(view.amount)}</Field>
            <Field label="Scheduled">{formatWhen(view.scheduledAt)}</Field>
            <Field label="Updated">{formatWhen(view.updatedAt)}</Field>
            {view.notes ? <Field label="Notes">{view.notes}</Field> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Advance status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {PIPELINE.map((status) => (
              <Button
                key={status}
                variant={view.status === status ? "default" : "outline"}
                disabled={saving}
                onClick={() => setStatus(status)}
              >
                {STATUS_LABELS[status]}
              </Button>
            ))}
            <Button variant="destructive" disabled={saving} onClick={() => setStatus("cancelled")}>
              Cancel booking
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Status timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {(view.events || []).map((event) => (
                <li key={event.id} className="flex items-start gap-3 border-l-2 border-primary/30 pl-4">
                  <div>
                    <StatusBadge status={event.status} />
                    <p className="mt-1 text-sm">{event.note}</p>
                    <p className="text-xs text-muted-foreground">{formatWhen(event.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}
