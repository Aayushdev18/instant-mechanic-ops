import { Router } from "express";
import { prisma } from "./db.js";
import { bookingInclude, serializeBooking } from "./serialize.js";

export const mechanicsRouter = Router();

mechanicsRouter.get("/mechanics", async (_req, res) => {
  const mechanics = await prisma.mechanic.findMany({
    orderBy: { name: "asc" },
    include: {
      bookings: {
        orderBy: { updatedAt: "desc" },
        take: 1,
        include: bookingInclude,
      },
    },
  });

  res.json(
    mechanics.map((m) => ({
      id: m.id,
      name: m.name,
      phone: m.phone,
      city: m.city,
      specialty: m.specialty,
      status: m.status,
      rating: m.rating,
      jobsCompleted: m.jobsCompleted,
      lat: m.lat,
      lng: m.lng,
      joinedAt: m.joinedAt.toISOString(),
      currentBooking: m.bookings[0] ? serializeBooking(m.bookings[0]) : null,
    }))
  );
});

mechanicsRouter.get("/mechanics/:id", async (req, res) => {
  const mechanic = await prisma.mechanic.findUnique({
    where: { id: String(req.params.id) },
    include: {
      bookings: {
        orderBy: { scheduledAt: "desc" },
        take: 20,
        include: bookingInclude,
      },
    },
  });
  if (!mechanic) {
    res.status(404).json({ error: "Mechanic not found" });
    return;
  }

  const [completed, active] = await Promise.all([
    prisma.booking.count({ where: { mechanicId: mechanic.id, status: "completed" } }),
    prisma.booking.count({
      where: {
        mechanicId: mechanic.id,
        status: { in: ["assigned", "on_the_way", "in_progress"] },
      },
    }),
  ]);

  res.json({
    id: mechanic.id,
    name: mechanic.name,
    phone: mechanic.phone,
    city: mechanic.city,
    specialty: mechanic.specialty,
    status: mechanic.status,
    rating: mechanic.rating,
    jobsCompleted: mechanic.jobsCompleted,
    lat: mechanic.lat,
    lng: mechanic.lng,
    joinedAt: mechanic.joinedAt.toISOString(),
    stats: { completed, active },
    bookings: mechanic.bookings.map(serializeBooking),
  });
});
