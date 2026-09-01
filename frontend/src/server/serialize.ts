import type { Booking, Customer, Mechanic, Service, Vehicle } from "@prisma/client";

type BookingWithRelations = Booking & {
  customer: Customer;
  vehicle: Vehicle;
  mechanic: Mechanic | null;
  service: Service;
};

export function serializeBooking(booking: BookingWithRelations) {
  return {
    id: booking.id,
    customer: {
      id: booking.customer.id,
      name: booking.customer.name,
      city: booking.customer.city,
      phone: booking.customer.phone,
      email: booking.customer.email,
    },
    vehicle: {
      id: booking.vehicle.id,
      make: booking.vehicle.make,
      model: booking.vehicle.model,
      year: booking.vehicle.year,
      plate: booking.vehicle.plate,
      label: `${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}`,
    },
    service: {
      id: booking.service.id,
      name: booking.service.name,
      category: booking.service.category,
    },
    mechanic: booking.mechanic
      ? {
          id: booking.mechanic.id,
          name: booking.mechanic.name,
          status: booking.mechanic.status,
          city: booking.mechanic.city,
        }
      : null,
    status: booking.status,
    amount: booking.amount,
    notes: booking.notes,
    scheduledAt: booking.scheduledAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
  };
}

export const bookingInclude = {
  customer: true,
  vehicle: true,
  mechanic: true,
  service: true,
} as const;
