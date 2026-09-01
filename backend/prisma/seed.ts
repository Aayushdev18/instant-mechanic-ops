import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);
const pick = <T,>(items: T[]) => items[Math.floor(rand() * items.length)];
const id = (prefix: string, n: number) => `${prefix}-${String(n).padStart(4, "0")}`;

const CITIES = [
  { name: "Bengaluru", lat: 12.9716, lng: 77.5946 },
  { name: "Hyderabad", lat: 17.385, lng: 78.4867 },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
  { name: "Mumbai", lat: 19.076, lng: 72.8777 },
  { name: "Chennai", lat: 13.0827, lng: 80.2707 },
  { name: "Delhi", lat: 28.6139, lng: 77.209 },
];

const FIRST = [
  "Aarav", "Ananya", "Rohan", "Isha", "Kabir", "Meera", "Vihaan", "Diya",
  "Arjun", "Saanvi", "Aditya", "Aisha", "Rahul", "Priya", "Karan", "Nisha",
  "Dev", "Tara", "Nikhil", "Riya", "Siddharth", "Pooja", "Harsh", "Neha",
];
const LAST = [
  "Sharma", "Patel", "Reddy", "Iyer", "Khan", "Nair", "Gupta", "Mehta",
  "Singh", "Joshi", "Desai", "Kapoor", "Malhotra", "Chopra", "Banerjee",
];

const MAKES = [
  { make: "Maruti Suzuki", models: ["Swift", "Baleno", "Dzire", "Brezza"] },
  { make: "Hyundai", models: ["i20", "Creta", "Venue", "Verna"] },
  { make: "Tata", models: ["Nexon", "Punch", "Harrier", "Altroz"] },
  { make: "Honda", models: ["City", "Amaze", "Elevate"] },
  { make: "Mahindra", models: ["XUV700", "Thar", "Scorpio N"] },
  { make: "Toyota", models: ["Innova", "Fortuner", "Glanza"] },
];

const SERVICES = [
  { name: "General service", category: "Maintenance", basePrice: 2499, durationMin: 90 },
  { name: "Express oil change", category: "Maintenance", basePrice: 1299, durationMin: 40 },
  { name: "Brake pad replacement", category: "Repairs", basePrice: 4599, durationMin: 120 },
  { name: "Battery jump + replace", category: "Electrical", basePrice: 3899, durationMin: 45 },
  { name: "AC gas refill", category: "Climate", basePrice: 2199, durationMin: 60 },
  { name: "Tyre puncture + rotation", category: "Tyres", basePrice: 899, durationMin: 35 },
  { name: "Engine diagnostics", category: "Diagnostics", basePrice: 1799, durationMin: 50 },
  { name: "Clutch overhaul", category: "Repairs", basePrice: 8999, durationMin: 240 },
  { name: "Wheel alignment", category: "Tyres", basePrice: 1499, durationMin: 55 },
  { name: "Car spa + interior", category: "Detailing", basePrice: 1999, durationMin: 80 },
  { name: "Pickup roadside assist", category: "Roadside", basePrice: 999, durationMin: 30 },
  { name: "Windshield chip repair", category: "Body", basePrice: 2599, durationMin: 70 },
];

const SPECIALTIES = [
  "Engine & diagnostics",
  "Brakes & suspension",
  "Electrical systems",
  "Tyres & alignment",
  "AC & climate",
  "Roadside response",
];

const STATUSES = [
  "pending",
  "assigned",
  "on_the_way",
  "in_progress",
  "completed",
  "cancelled",
] as const;

function weightedStatus() {
  const roll = rand();
  if (roll < 0.12) return "pending";
  if (roll < 0.22) return "assigned";
  if (roll < 0.32) return "on_the_way";
  if (roll < 0.4) return "in_progress";
  if (roll < 0.88) return "completed";
  return "cancelled";
}

async function main() {
  await prisma.bookingEvent.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.mechanic.deleteMany();
  await prisma.service.deleteMany();

  const services = SERVICES.map((s, i) => ({ id: id("svc", i + 1), ...s }));
  await prisma.service.createMany({ data: services });

  const mechanics = Array.from({ length: 24 }, (_, i) => {
    const city = pick(CITIES);
    const first = pick(FIRST);
    const last = pick(LAST);
    const statusRoll = rand();
    const status = statusRoll < 0.2 ? "off_shift" : statusRoll < 0.55 ? "on_job" : "available";
    return {
      id: id("mech", i + 1),
      name: `${first} ${last}`,
      phone: `98${String(10000000 + Math.floor(rand() * 89999999)).slice(0, 8)}`,
      city: city.name,
      specialty: pick(SPECIALTIES),
      status,
      rating: Number((3.8 + rand() * 1.2).toFixed(1)),
      jobsCompleted: 40 + Math.floor(rand() * 220),
      lat: city.lat + (rand() - 0.5) * 0.18,
      lng: city.lng + (rand() - 0.5) * 0.18,
      joinedAt: new Date(Date.now() - Math.floor(rand() * 400) * 86400000),
    };
  });
  await prisma.mechanic.createMany({ data: mechanics });

  const customers = Array.from({ length: 60 }, (_, i) => {
    const first = pick(FIRST);
    const last = pick(LAST);
    const city = pick(CITIES);
    return {
      id: id("cust", i + 1),
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@mail.test`,
      phone: `9${String(100000000 + Math.floor(rand() * 899999999)).slice(0, 9)}`,
      city: city.name,
      createdAt: new Date(Date.now() - Math.floor(rand() * 120) * 86400000),
    };
  });
  await prisma.customer.createMany({ data: customers });

  const vehicles = customers.flatMap((c, i) => {
    const count = rand() < 0.25 ? 2 : 1;
    return Array.from({ length: count }, (_, j) => {
      const brand = pick(MAKES);
      return {
        id: id("veh", i * 10 + j + 1),
        customerId: c.id,
        make: brand.make,
        model: pick(brand.models),
        year: 2016 + Math.floor(rand() * 10),
        plate: `${pick(["KA", "MH", "TS", "TN", "DL", "GJ"])}${10 + Math.floor(rand() * 50)}${pick(["AB", "CD", "EF", "MK", "QR"])}${1000 + Math.floor(rand() * 8999)}`,
      };
    });
  });
  await prisma.vehicle.createMany({ data: vehicles });

  const vehiclesByCustomer = new Map<string, typeof vehicles>();
  for (const v of vehicles) {
    const list = vehiclesByCustomer.get(v.customerId) ?? [];
    list.push(v);
    vehiclesByCustomer.set(v.customerId, list);
  }

  const now = Date.now();
  const bookings = Array.from({ length: 560 }, (_, i) => {
    const customer = pick(customers);
    const vehicle = pick(vehiclesByCustomer.get(customer.id)!);
    const service = pick(services);
    const status = i < 28 ? STATUSES[i % 6] : weightedStatus();
    const mechanic =
      status === "pending" || status === "cancelled"
        ? rand() < 0.2
          ? pick(mechanics)
          : null
        : pick(mechanics);
    const daysAgo = Math.floor(rand() * 45) - 3;
    const scheduledAt = new Date(now - daysAgo * 86400000 - Math.floor(rand() * 12) * 3600000);
    const amount = service.basePrice + Math.floor(rand() * 1200);
    return {
      id: id("BK", i + 1),
      customerId: customer.id,
      vehicleId: vehicle.id,
      mechanicId: mechanic?.id ?? null,
      serviceId: service.id,
      status,
      amount,
      notes: rand() < 0.3 ? "Customer requested morning slot." : null,
      scheduledAt,
      updatedAt: new Date(scheduledAt.getTime() + Math.floor(rand() * 8) * 3600000),
    };
  });

  const chunk = 100;
  for (let i = 0; i < bookings.length; i += chunk) {
    await prisma.booking.createMany({ data: bookings.slice(i, i + chunk) });
  }

  const events = bookings.flatMap((b) => {
    const pipeline = ["pending", "assigned", "on_the_way", "in_progress", "completed"];
    let path: string[] = [];
    if (b.status === "cancelled") {
      path = rand() < 0.5 ? ["pending", "cancelled"] : ["pending", "assigned", "cancelled"];
    } else {
      const idx = pipeline.indexOf(b.status);
      path = pipeline.slice(0, Math.max(1, idx + 1));
    }
    return path.map((status, i) => ({
      id: randomUUID(),
      bookingId: b.id,
      status,
      note: i === 0 ? "Booking created" : `Moved to ${status.replaceAll("_", " ")}`,
      createdAt: new Date(b.scheduledAt.getTime() + i * 45 * 60000),
    }));
  });

  for (let i = 0; i < events.length; i += 200) {
    await prisma.bookingEvent.createMany({ data: events.slice(i, i + 200) });
  }

  console.log(
    JSON.stringify(
      {
        customers: customers.length,
        vehicles: vehicles.length,
        mechanics: mechanics.length,
        services: services.length,
        bookings: bookings.length,
        events: events.length,
      },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
