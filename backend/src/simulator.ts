import { prisma } from "./db.js";
import { broadcast } from "./broadcast.js";
import { bookingInclude, serializeBooking } from "./serialize.js";
import { nextLiveStatus } from "./status.js";
import { randomUUID } from "node:crypto";

let timer: NodeJS.Timeout | null = null;

export function startSimulator() {
  if (process.env.SIMULATOR_ENABLED === "false") return;
  const interval = Number(process.env.SIMULATOR_INTERVAL_MS || 4000);
  timer = setInterval(() => {
    tick().catch((err) => console.error("simulator tick failed", err));
  }, interval);
}

export function stopSimulator() {
  if (timer) clearInterval(timer);
}

async function reopenIdleJobs(needed: number) {
  const completed = await prisma.booking.findMany({
    where: { status: "completed" },
    take: needed,
    orderBy: { updatedAt: "asc" },
  });
  const now = new Date();
  for (const job of completed) {
    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.booking.update({
        where: { id: job.id },
        data: {
          status: "pending",
          mechanicId: null,
          scheduledAt: now,
          updatedAt: now,
        },
        include: bookingInclude,
      });
      await tx.bookingEvent.create({
        data: {
          id: randomUUID(),
          bookingId: job.id,
          status: "pending",
          note: "Re-queued from completed jobs to keep the live board moving",
          createdAt: now,
        },
      });
      return row;
    });
    broadcast("booking.updated", serializeBooking(updated));
  }
}

async function tick() {
  const activeCount = await prisma.booking.count({
    where: { status: { in: ["pending", "assigned", "on_the_way", "in_progress"] } },
  });
  if (activeCount < 8) {
    await reopenIdleJobs(8 - activeCount);
  }

  const active = await prisma.booking.findMany({
    where: { status: { in: ["pending", "assigned", "on_the_way", "in_progress"] } },
    include: bookingInclude,
    take: 40,
    orderBy: { updatedAt: "asc" },
  });
  if (active.length === 0) return;

  const booking = active[Math.floor(Math.random() * Math.min(active.length, 12))];
  const next = nextLiveStatus(booking.status);
  if (!next) return;

  let mechanicId = booking.mechanicId;
  if (next === "assigned" && !mechanicId) {
    const available = await prisma.mechanic.findFirst({
      where: { status: "available" },
    });
    mechanicId = available?.id ?? booking.mechanicId;
  }

  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: next,
        mechanicId,
        updatedAt: now,
      },
      include: bookingInclude,
    });
    await tx.bookingEvent.create({
      data: {
        id: randomUUID(),
        bookingId: booking.id,
        status: next,
        note: `Live ops: ${booking.status} → ${next}`,
        createdAt: now,
      },
    });
    if (row.mechanicId) {
      await tx.mechanic.update({
        where: { id: row.mechanicId },
        data: {
          status: next === "completed" ? "available" : "on_job",
          jobsCompleted: next === "completed" ? { increment: 1 } : undefined,
        },
      });
    }
    return row;
  });

  const payload = serializeBooking(updated);
  broadcast("booking.updated", payload);
  broadcast("notification", {
    title: `Booking ${updated.id} updated`,
    body: `${updated.customer.name} · ${updated.service.name} is now ${next.replaceAll("_", " ")}`,
    status: next,
    bookingId: updated.id,
  });
}
