export const BOOKING_STATUSES = [
  "pending",
  "assigned",
  "on_the_way",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const LIVE_PIPELINE: BookingStatus[] = [
  "pending",
  "assigned",
  "on_the_way",
  "in_progress",
  "completed",
];

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  assigned: "Assigned",
  on_the_way: "Mechanic on the way",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function isBookingStatus(value: string): value is BookingStatus {
  return (BOOKING_STATUSES as readonly string[]).includes(value);
}

export function nextLiveStatus(status: string): BookingStatus | null {
  const index = LIVE_PIPELINE.indexOf(status as BookingStatus);
  if (index === -1 || index === LIVE_PIPELINE.length - 1) return null;
  return LIVE_PIPELINE[index + 1];
}
