import {
  getBooking,
  getBookings,
  getCustomers,
  getDashboard,
  getMechanic,
  getMechanics,
} from "@/server/queries";

function apiBase() {
  return process.env.INTERNAL_API_URL || "http://127.0.0.1:43123";
}

async function fromSqlite(pathWithQuery: string) {
  const url = new URL(pathWithQuery, "http://local.invalid");
  const parts = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);

  if (parts[0] === "dashboard") return getDashboard();
  if (parts[0] === "bookings" && parts.length === 1) return getBookings(url.searchParams);
  if (parts[0] === "bookings" && parts[1]) {
    const row = await getBooking(parts[1]);
    if (!row) throw new Error("Booking not found");
    return row;
  }
  if (parts[0] === "mechanics" && parts.length === 1) return getMechanics();
  if (parts[0] === "mechanics" && parts[1]) {
    const row = await getMechanic(parts[1]);
    if (!row) throw new Error("Mechanic not found");
    return row;
  }
  if (parts[0] === "customers") return getCustomers(url.searchParams);
  throw new Error(`Unknown path ${pathWithQuery}`);
}

export async function getJson<T>(path: string): Promise<T> {
  if (process.env.VERCEL) {
    return (await fromSqlite(path)) as T;
  }
  const res = await fetch(`${apiBase()}${path}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Backend ${res.status} for ${path}`);
  }
  return res.json() as Promise<T>;
}
