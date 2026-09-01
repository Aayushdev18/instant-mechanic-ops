export type BookingStatus =
  | "pending"
  | "assigned"
  | "on_the_way"
  | "in_progress"
  | "completed"
  | "cancelled";

export type Person = {
  id: string;
  name: string;
  city?: string;
  phone?: string;
  email?: string;
  status?: string;
};

export type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  plate: string;
  label: string;
};

export type Service = {
  id: string;
  name: string;
  category: string;
};

export type Booking = {
  id: string;
  customer: Person;
  vehicle: Vehicle;
  service: Service;
  mechanic: Person | null;
  status: BookingStatus;
  amount: number;
  notes?: string | null;
  scheduledAt: string;
  updatedAt: string;
  events?: { id: string; status: string; note: string; createdAt: string }[];
};

export type DashboardPayload = {
  kpis: {
    totalBookings: number;
    todaysBookings: number;
    completedBookings: number;
    pendingBookings: number;
    cancelledBookings: number;
    totalRevenue: number;
    activeMechanics: number;
    newCustomers: number;
  };
  charts: {
    bookingsOverTime: { date: string; bookings: number; revenue: number }[];
    revenueOverTime: { date: string; revenue: number }[];
    bookingStatus: { status: string; count: number }[];
    serviceBreakdown: { category: string; bookings: number; revenue: number }[];
  };
  recentBookings: Booking[];
  mechanics: {
    id: string;
    name: string;
    status: string;
    city: string;
    specialty: string;
    jobsCompleted: number;
    rating: number;
    lat: number;
    lng: number;
  }[];
};

export type Paginated<T> = {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type Mechanic = {
  id: string;
  name: string;
  phone: string;
  city: string;
  specialty: string;
  status: string;
  rating: number;
  jobsCompleted: number;
  lat: number;
  lng: number;
  joinedAt: string;
  currentBooking?: Booking | null;
  stats?: { completed: number; active: number };
  bookings?: Booking[];
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  createdAt: string;
  vehicles: { id: string; make: string; model: string; year: number; plate: string }[];
  bookingCount?: number;
  spend?: number;
  bookings?: Booking[];
};
