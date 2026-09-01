import { Router } from "express";
import { prisma } from "./db.js";
import { broadcast } from "./broadcast.js";
import { bookingInclude, serializeBooking } from "./serialize.js";
import { isBookingStatus } from "./status.js";
import { randomUUID } from "node:crypto";

export const bookingsRouter = Router();

const SORTABLE = new Set(["scheduledAt", "amount", "status", "id", "updatedAt"]);

bookingsRouter.get("/bookings", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const status = typeof req.query.status === "string" ? req.query.status : "";
  const mechanicId = typeof req.query.mechanicId === "string" ? req.query.mechanicId : "";
  const category = typeof req.query.category === "string" ? req.query.category : "";
  const from = typeof req.query.from === "string" ? req.query.from : "";
  const to = typeof req.query.to === "string" ? req.query.to : "";
  const sort = SORTABLE.has(String(req.query.sort)) ? String(req.query.sort) : "scheduledAt";
  const order = req.query.order === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(5, Number(req.query.pageSize) || 10));

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (mechanicId) where.mechanicId = mechanicId;
  if (category) where.service = { category };
  if (from || to) {
    where.scheduledAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }
  if (q) {
    where.OR = [
      { id: { contains: q } },
      { customer: { name: { contains: q } } },
      { customer: { email: { contains: q } } },
      { vehicle: { plate: { contains: q } } },
      { vehicle: { make: { contains: q } } },
      { vehicle: { model: { contains: q } } },
      { service: { name: { contains: q } } },
      { mechanic: { name: { contains: q } } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      include: bookingInclude,
      orderBy: { [sort]: order },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  res.json({
    data: rows.map(serializeBooking),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});

bookingsRouter.get("/bookings/export", async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : "";
  const where = status ? { status } : {};
  const rows = await prisma.booking.findMany({
    where,
    include: bookingInclude,
    orderBy: { scheduledAt: "desc" },
  });

  const header = [
    "Booking ID",
    "Customer",
    "Vehicle",
    "Service",
    "Mechanic",
    "Status",
    "Amount",
    "Scheduled At",
  ];
  const lines = [
    header.join(","),
    ...rows.map((b) =>
      [
        b.id,
        csv(b.customer.name),
        csv(`${b.vehicle.year} ${b.vehicle.make} ${b.vehicle.model}`),
        csv(b.service.name),
        csv(b.mechanic?.name ?? ""),
        b.status,
        b.amount,
        b.scheduledAt.toISOString(),
      ].join(",")
    ),
  ];

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=bookings.csv");
  res.send(lines.join("\n"));
});

bookingsRouter.get("/bookings/:id", async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: String(req.params.id) },
    include: {
      ...bookingInclude,
      events: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  res.json({
    ...serializeBooking(booking),
    events: booking.events.map((e) => ({
      id: e.id,
      status: e.status,
      note: e.note,
      createdAt: e.createdAt.toISOString(),
    })),
  });
});

bookingsRouter.patch("/bookings/:id/status", async (req, res) => {
  const status = String(req.body?.status ?? "");
  if (!isBookingStatus(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  const existing = await prisma.booking.findUnique({ where: { id: String(req.params.id) } });
  if (!existing) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

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
        note: req.body?.note || `Status changed to ${status}`,
        createdAt: now,
      },
    });
    if (booking.mechanicId) {
      const onJob = ["assigned", "on_the_way", "in_progress"].includes(status);
      await tx.mechanic.update({
        where: { id: booking.mechanicId },
        data: {
          status: onJob ? "on_job" : "available",
          jobsCompleted:
            status === "completed"
              ? { increment: 1 }
              : undefined,
        },
      });
    }
    return booking;
  });

  const payload = serializeBooking(updated);
  broadcast("booking.updated", payload);
  res.json(payload);
});

function csv(value: string) {
  if (value.includes(",") || value.includes('"')) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}
