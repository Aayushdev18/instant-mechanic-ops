"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLive } from "@/components/live-provider";
import { exportUrl } from "@/lib/api";
import { useApiQuery } from "@/lib/use-api-query";
import { formatWhen, inr } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/status";
import type { Booking, Paginated } from "@/lib/types";

const STATUSES = ["", "pending", "assigned", "on_the_way", "in_progress", "completed", "cancelled"];

export function BookingsView({
  initial,
  queryString,
  filters,
}: {
  initial: Paginated<Booking>;
  queryString: string;
  filters: { q: string; status: string; sort: string; order: string; page: number };
}) {
  const { lastBooking } = useLive();
  const { data } = useApiQuery<Paginated<Booking>>(`/api/bookings?${queryString}`, initial);
  const pageData = data ?? initial;
  const rows = pageData.data.map((row) =>
    lastBooking && lastBooking.id === row.id ? { ...row, ...lastBooking } : row
  );

  function href(overrides: Record<string, string | number>) {
    const params = new URLSearchParams();
    const next = {
      q: filters.q,
      status: filters.status,
      sort: filters.sort,
      order: filters.order,
      page: String(filters.page),
      ...overrides,
    };
    Object.entries(next).forEach(([k, v]) => {
      if (v) params.set(k, String(v));
    });
    const qs = params.toString();
    return qs ? `/bookings?${qs}` : "/bookings";
  }

  function sortHref(key: string) {
    const order = filters.sort === key && filters.order === "desc" ? "asc" : "desc";
    return href({ sort: key, order, page: 1 });
  }

  return (
    <AppShell
      title="Bookings"
      description="Search, filter, and dispatch the live job board."
      actions={
        <a className={buttonVariants({ variant: "outline" })} href={exportUrl(filters.status || undefined)}>
          Export CSV
        </a>
      }
    >
      <form method="get" action="/bookings" className="mb-4 flex flex-col gap-3 md:flex-row">
        <Input
          name="q"
          defaultValue={filters.q}
          placeholder="Search customer, vehicle, plate, mechanic, booking ID"
          className="md:max-w-md"
        />
        <select
          name="status"
          defaultValue={filters.status}
          className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s || "all"} value={s}>
              {s ? STATUS_LABELS[s] : "All statuses"}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          Apply
        </Button>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          title="No bookings match these filters"
          body="Clear search or switch status to see the rest of the board."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Link href={sortHref("id")}>Booking ID</Link>
                </TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Mechanic</TableHead>
                <TableHead>
                  <Link href={sortHref("status")}>Status</Link>
                </TableHead>
                <TableHead>
                  <Link href={sortHref("amount")}>Amount</Link>
                </TableHead>
                <TableHead>
                  <Link href={sortHref("scheduledAt")}>Date / time</Link>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((b) => (
                <TableRow key={b.id} data-booking-id={b.id}>
                  <TableCell>
                    <Link href={`/bookings/${b.id}`} className="font-mono text-xs text-primary hover:underline">
                      {b.id}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{b.customer.name}</div>
                    <div className="text-xs text-muted-foreground">{b.customer.city}</div>
                  </TableCell>
                  <TableCell>
                    <div>{b.vehicle.label}</div>
                    <div className="text-xs text-muted-foreground">{b.vehicle.plate}</div>
                  </TableCell>
                  <TableCell>
                    <div>{b.service.name}</div>
                    <div className="text-xs text-muted-foreground">{b.service.category}</div>
                  </TableCell>
                  <TableCell data-booking-mechanic>{b.mechanic?.name ?? "Unassigned"}</TableCell>
                  <TableCell>
                    <StatusBadge status={b.status} />
                  </TableCell>
                  <TableCell className="tabular-nums">{inr(b.amount)}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatWhen(b.scheduledAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
            <p className="text-muted-foreground">
              {pageData.total} bookings · page {pageData.page} of {pageData.totalPages}
            </p>
            <div className="flex gap-2">
              {filters.page > 1 ? (
                <Link className={buttonVariants({ variant: "outline" })} href={href({ page: filters.page - 1 })}>
                  Previous
                </Link>
              ) : (
                <Button variant="outline" disabled>
                  Previous
                </Button>
              )}
              {filters.page < pageData.totalPages ? (
                <Link className={buttonVariants({ variant: "outline" })} href={href({ page: filters.page + 1 })}>
                  Next
                </Link>
              ) : (
                <Button variant="outline" disabled>
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
