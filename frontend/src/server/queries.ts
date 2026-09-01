import { prisma } from "@/server/db";
import { bookingInclude, serializeBooking } from "@/server/serialize";

const SORTABLE = new Set(["scheduledAt", "amount", "status", "id", "updatedAt"]);

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function getDashboard() {
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
    prisma.booking.aggregate({ _sum: { amount: true }, where: { status: { not: "cancelled" } } }),
    prisma.mechanic.count({ where: { status: { in: ["available", "on_job"] } } }),
    prisma.customer.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.booking.groupBy({ by: ["serviceId"], _count: { _all: true }, _sum: { amount: true } }),
    prisma.booking.findMany({
      where: { scheduledAt: { gte: thirtyDaysAgo } },
      select: { scheduledAt: true, amount: true, status: true },
    }),
    prisma.booking.findMany({ take: 8, orderBy: { updatedAt: "desc" }, include: bookingInclude }),
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
    if (row.status !== "cancelled") bookingsOverTime[index].revenue += row.amount;
  }
  const categoryMap = new Map<string, { category: string; bookings: number; revenue: number }>();
  for (const group of categoryGroups) {
    const category = serviceById[group.serviceId]?.category ?? "Other";
    const current = categoryMap.get(category) ?? { category, bookings: 0, revenue: 0 };
    current.bookings += group._count._all;
    current.revenue += group._sum.amount ?? 0;
    categoryMap.set(category, current);
  }
  return {
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
  };
}

export async function getBookings(sp: URLSearchParams) {
  const q = sp.get("q")?.trim() || "";
  const status = sp.get("status") || "";
  const sort = SORTABLE.has(String(sp.get("sort"))) ? String(sp.get("sort")) : "scheduledAt";
  const order = sp.get("order") === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(50, Math.max(5, Number(sp.get("pageSize")) || 10));
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { id: { contains: q } },
      { customer: { name: { contains: q } } },
      { vehicle: { plate: { contains: q } } },
      { vehicle: { make: { contains: q } } },
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
  return {
    data: rows.map(serializeBooking),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getBooking(id: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { ...bookingInclude, events: { orderBy: { createdAt: "asc" } } },
  });
  if (!booking) return null;
  return {
    ...serializeBooking(booking),
    events: booking.events.map((e) => ({
      id: e.id,
      status: e.status,
      note: e.note,
      createdAt: e.createdAt.toISOString(),
    })),
  };
}

export async function getMechanics() {
  const mechanics = await prisma.mechanic.findMany({
    orderBy: { name: "asc" },
    include: { bookings: { orderBy: { updatedAt: "desc" }, take: 1, include: bookingInclude } },
  });
  return mechanics.map((m) => ({
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
  }));
}

export async function getMechanic(id: string) {
  const mechanic = await prisma.mechanic.findUnique({
    where: { id },
    include: { bookings: { orderBy: { scheduledAt: "desc" }, take: 20, include: bookingInclude } },
  });
  if (!mechanic) return null;
  const [completed, active] = await Promise.all([
    prisma.booking.count({ where: { mechanicId: mechanic.id, status: "completed" } }),
    prisma.booking.count({
      where: { mechanicId: mechanic.id, status: { in: ["assigned", "on_the_way", "in_progress"] } },
    }),
  ]);
  return {
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
  };
}

export async function getCustomers(sp: URLSearchParams) {
  const q = sp.get("q")?.trim() || "";
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(50, Math.max(5, Number(sp.get("pageSize")) || 12));
  const where = q
    ? { OR: [{ name: { contains: q } }, { email: { contains: q } }, { city: { contains: q } }] }
    : {};
  const [total, rows] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      include: { vehicles: true, bookings: { select: { id: true, amount: true, status: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return {
    data: rows.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      city: c.city,
      createdAt: c.createdAt.toISOString(),
      vehicles: c.vehicles,
      bookingCount: c.bookings.length,
      spend: c.bookings.filter((b) => b.status !== "cancelled").reduce((sum, b) => sum + b.amount, 0),
    })),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
