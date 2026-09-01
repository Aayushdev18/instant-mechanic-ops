"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/states";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useApiQuery } from "@/lib/use-api-query";
import { inr } from "@/lib/format";
import type { Customer, Paginated } from "@/lib/types";

export function CustomersView({
  initial,
  queryString,
  filters,
}: {
  initial: Paginated<Customer>;
  queryString: string;
  filters: { q: string; page: number };
}) {
  const { data } = useApiQuery<Paginated<Customer>>(`/api/customers?${queryString}`, initial);
  const pageData = data ?? initial;

  function href(page: number) {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    params.set("page", String(page));
    return `/customers?${params}`;
  }

  return (
    <AppShell title="Customers" description="Who is booking, which vehicles, and spend.">
      <form method="get" action="/customers" className="mb-4 flex max-w-md gap-2">
        <Input name="q" defaultValue={filters.q} placeholder="Search name, email, phone, city" />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>
      {pageData.data.length === 0 ? (
        <EmptyState title="No customers match" body="Try a different name or city." />
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {pageData.data.map((c) => (
              <Card key={c.id}>
                <CardHeader>
                  <CardTitle className="text-base">{c.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>{c.city}</p>
                  <p>{c.email}</p>
                  <p className="mt-2">
                    {c.bookingCount} bookings · {inr(c.spend || 0)} spend
                  </p>
                  <p className="mt-1">
                    {c.vehicles.map((v) => `${v.make} ${v.model}`).join(" · ")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            {filters.page > 1 ? (
              <Link className={buttonVariants({ variant: "outline" })} href={href(filters.page - 1)}>
                Previous
              </Link>
            ) : (
              <Button variant="outline" disabled>
                Previous
              </Button>
            )}
            {filters.page < pageData.totalPages ? (
              <Link className={buttonVariants({ variant: "outline" })} href={href(filters.page + 1)}>
                Next
              </Link>
            ) : (
              <Button variant="outline" disabled>
                Next
              </Button>
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}
