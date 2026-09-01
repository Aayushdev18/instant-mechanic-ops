"use client";

import type { DashboardPayload } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MechanicMap({
  mechanics,
}: {
  mechanics: DashboardPayload["mechanics"];
}) {
  const lats = mechanics.map((m) => m.lat);
  const lngs = mechanics.map((m) => m.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mechanic locations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-72 overflow-hidden rounded-xl border bg-[radial-gradient(circle_at_top,_rgba(255,170,60,0.12),_transparent_55%),linear-gradient(180deg,oklch(0.22_0.02_250),oklch(0.18_0.01_250))]">
          <div className="pointer-events-none absolute inset-4 rounded-lg border border-white/10" />
          {mechanics.map((m) => {
            const x = ((m.lng - minLng) / (maxLng - minLng || 1)) * 100;
            const y = (1 - (m.lat - minLat) / (maxLat - minLat || 1)) * 100;
            const color =
              m.status === "available"
                ? "bg-emerald-400"
                : m.status === "on_job"
                  ? "bg-orange-400"
                  : "bg-zinc-400";
            return (
              <div
                key={m.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${x}%`, top: `${y}%` }}
                title={`${m.name} · ${m.city}`}
              >
                <span className={`block size-2.5 rounded-full ${color} shadow`} />
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-emerald-400" /> Available
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-orange-400" /> On job
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-zinc-400" /> Off shift
          </span>
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {mechanics.slice(0, 6).map((m) => (
            <li key={m.id} className="flex items-center justify-between text-sm">
              <span>{m.name}</span>
              <StatusBadge status={m.status} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
