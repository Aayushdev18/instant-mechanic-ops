import { Router } from "express";
import { prisma } from "./db.js";
import { bookingInclude, serializeBooking } from "./serialize.js";

export const customersRouter = Router();

customersRouter.get("/customers", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(5, Number(req.query.pageSize) || 12));

  const where = q
    ? {
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
          { phone: { contains: q } },
          { city: { contains: q } },
        ],
      }
    : {};

  const [total, rows] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      include: {
        vehicles: true,
        bookings: { select: { id: true, amount: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  res.json({
    data: rows.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      city: c.city,
      createdAt: c.createdAt.toISOString(),
      vehicles: c.vehicles,
      bookingCount: c.bookings.length,
      spend: c.bookings
        .filter((b) => b.status !== "cancelled")
        .reduce((sum, b) => sum + b.amount, 0),
    })),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});

customersRouter.get("/customers/:id", async (req, res) => {
  const customer = await prisma.customer.findUnique({
    where: { id: String(req.params.id) },
    include: {
      vehicles: true,
      bookings: {
        orderBy: { scheduledAt: "desc" },
        include: bookingInclude,
      },
    },
  });
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  res.json({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    city: customer.city,
    createdAt: customer.createdAt.toISOString(),
    vehicles: customer.vehicles,
    bookings: customer.bookings.map(serializeBooking),
  });
});
