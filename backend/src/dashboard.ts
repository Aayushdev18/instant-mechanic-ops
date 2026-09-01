import { Router } from "express";
import { prisma } from "./db.js";
import { bookingInclude, serializeBooking } from "./serialize.js";

export const dashboardRouter = Router();

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

dashboardRouter.get("/dashboard", async (_req, res) => {
  const today = startOfToday();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 29);

  const [
    totalBookings,
    todaysBookings,
    completedBookings,
    pendingBookings,
    cancelledBookings,
    revenue,
    activeMechanics,
    newCustomers,
    statusGroups,
    categoryGroups,
    dailyBookings,
    recentBookings,
    mechanics,
  ] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { scheduledAt: { gte: today } } }),
    prisma.booking.count({ where: { status: "completed" } }),
    prisma.booking.count({
      where: { status: { in: ["pending", "assigned", "on_the_way", "in_progress"] } },
    }),
    prisma.booking.count({ where: { status: "cancelled" } }),
    prisma.booking.aggregate({
      _sum: { amount: true },
      where: { status: { not: "cancelled" } },
    }),
    prisma.mechanic.count({
      where: { status: { in: ["available", "on_job"] } },
    }),
    prisma.customer.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.booking.groupBy({
      by: ["serviceId"],
      _count: { _all: true },
      _sum: { amount: true },
    }),
    prisma.booking.findMany({
      where: { scheduledAt: { gte: thirtyDaysAgo } },
      select: { scheduledAt: true, amount: true, status: true },
    }),
    prisma.booking.findMany({
      take: 8,
      orderBy: { updatedAt: "desc" },
      include: bookingInclude,
    }),
    prisma.mechanic.findMany({ orderBy: { name: "asc" } }),
  ]);

  const services = await prisma.service.findMany();
  const serviceById = Object.fromEntries(services.map((s) => [s.id, s]));

  const dayKeys: string[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(thirtyDaysAgo.getDate() + i);
    dayKeys.push(d.toISOString().slice(0, 10));
  }

  const bookingsOverTime = dayKeys.map((date) => ({ date, bookings: 0, revenue: 0 }));
  const byDate = Object.fromEntries(bookingsOverTime.map((row, i) => [row.date, i]));

  for (const row of dailyBookings) {
    const key = row.scheduledAt.toISOString().slice(0, 10);
    const index = byDate[key];
    if (index === undefined) continue;
    bookingsOverTime[index].bookings += 1;
    if (row.status !== "cancelled") {
      bookingsOverTime[index].revenue += row.amount;
    }
  }

  const categoryMap = new Map<string, { category: string; bookings: number; revenue: number }>();
  for (const group of categoryGroups) {
    const service = serviceById[group.serviceId];
    const category = service?.category ?? "Other";
    const current = categoryMap.get(category) ?? { category, bookings: 0, revenue: 0 };
    current.bookings += group._count._all;
    current.revenue += group._sum.amount ?? 0;
    categoryMap.set(category, current);
  }

  res.json({
    kpis: {
      totalBookings,
      todaysBookings,
      completedBookings,
      pendingBookings,
      cancelledBookings,
      totalRevenue: revenue._sum.amount ?? 0,
      activeMechanics,
      newCustomers,
    },
    charts: {
      bookingsOverTime,
      revenueOverTime: bookingsOverTime.map((row) => ({ date: row.date, revenue: row.revenue })),
      bookingStatus: statusGroups.map((g) => ({ status: g.status, count: g._count._all })),
      serviceBreakdown: [...categoryMap.values()].sort((a, b) => b.bookings - a.bookings),
    },
    recentBookings: recentBookings.map(serializeBooking),
    mechanics: mechanics.map((m) => ({
      id: m.id,
      name: m.name,
      status: m.status,
      city: m.city,
      specialty: m.specialty,
      jobsCompleted: m.jobsCompleted,
      rating: m.rating,
      lat: m.lat,
      lng: m.lng,
    })),
  });
});
