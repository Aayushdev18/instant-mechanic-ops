import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/server/db";
import { bookingInclude, serializeBooking } from "@/server/serialize";
import {
  getBooking,
  getBookings,
  getCustomers,
  getDashboard,
  getMechanic,
  getMechanics,
} from "@/server/queries";

export const dynamic = "force-dynamic";

const STATUSES = new Set(["pending", "assigned", "on_the_way", "in_progress", "completed", "cancelled"]);

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

async function proxy(req: NextRequest) {
  const backend = (process.env.BACKEND_URL || "http://127.0.0.1:43124").replace(/\/$/, "");
  const src = new URL(req.url);
  const dest = `${backend}${src.pathname}${src.search}`;
  const res = await fetch(dest, {
    method: req.method,
    headers: { "content-type": req.headers.get("content-type") || "application/json" },
    body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.text(),
    cache: "no-store",
  });
  return new Response(await res.arrayBuffer(), {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") || "application/json",
    },
  });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  try {
    return await handleGet(req, ctx);
  } catch (err) {
    console.error(err);
    return json({ error: err instanceof Error ? err.message : "API error" }, 500);
  }
}

async function handleGet(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  if (!process.env.VERCEL) {
    return proxy(req);
  }
  const slug = (await ctx.params).slug || [];
  const path = slug.join("/");
  const url = new URL(req.url);

  if (path === "health") {
    return json({ ok: true, service: "instant-mechanic-api", time: new Date().toISOString() });
  }
  if (path === "dashboard") return json(await getDashboard());
  if (path === "events") {
    const body = `event: hello\ndata: ${JSON.stringify({ event: "hello", payload: { message: "SSE connected" }, at: new Date().toISOString() })}\n\n`;
    return new Response(body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  }
  if (path === "bookings/export" || (path === "bookings" && url.searchParams.get("export") === "1")) {
    const status = url.searchParams.get("status") || "";
    const rows = await prisma.booking.findMany({
      where: status ? { status } : {},
      include: bookingInclude,
      orderBy: { scheduledAt: "desc" },
    });
    const header = "Booking ID,Customer,Vehicle,Service,Mechanic,Status,Amount,Scheduled At";
    const lines = [
      header,
      ...rows.map((b) =>
        [
          b.id,
          b.customer.name,
          `${b.vehicle.year} ${b.vehicle.make} ${b.vehicle.model}`,
          b.service.name,
          b.mechanic?.name ?? "",
          b.status,
          b.amount,
          b.scheduledAt.toISOString(),
        ].join(",")
      ),
    ];
    return new Response(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=bookings.csv",
      },
    });
  }
  if (path === "bookings") {
    return json(await getBookings(url.searchParams));
  }
  if (slug[0] === "bookings" && slug[1] && slug.length === 2) {
    const booking = await getBooking(slug[1]);
    if (!booking) return json({ error: "Booking not found" }, 404);
    return json(booking);
  }
  if (path === "mechanics") {
    return json(await getMechanics());
  }
  if (slug[0] === "mechanics" && slug[1]) {
    const mechanic = await getMechanic(slug[1]);
    if (!mechanic) return json({ error: "Mechanic not found" }, 404);
    return json(mechanic);
  }
  if (path === "customers") {
    return json(await getCustomers(url.searchParams));
  }
  return json({ error: "Not found" }, 404);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  try {
    return await handlePatch(req, ctx);
  } catch (err) {
    console.error(err);
    return json({ error: err instanceof Error ? err.message : "API error" }, 500);
  }
}

async function handlePatch(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  if (!process.env.VERCEL) {
    return proxy(req);
  }
  const slug = (await ctx.params).slug || [];
  if (slug[0] === "bookings" && slug[2] === "status" && slug[1]) {
    const body = await req.json().catch(() => ({}));
    const status = String(body.status ?? "");
    if (!STATUSES.has(status)) return json({ error: "Invalid status" }, 400);
    const existing = await prisma.booking.findUnique({ where: { id: slug[1] } });
    if (!existing) return json({ error: "Booking not found" }, 404);
    const now = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.update({
        where: { id: existing.id },
        data: { status, updatedAt: now },
        include: bookingInclude,
      });
      await tx.bookingEvent.create({
        data: {
          id: randomUUID(),
          bookingId: existing.id,
          status,
          note: body.note || `Status changed to ${status}`,
          createdAt: now,
        },
      });
      return booking;
    });
    return json(serializeBooking(updated));
  }
  return json({ error: "Not found" }, 404);
}
