import type { BookingRequest, TourismHost } from "@eco-nojin/domain-types";

/**
 * Bookings that belong to one host's own stays or experiences.
 *
 * This is a demo-frontend visibility rule, not server-side authorization.
 */
export function bookingsForHost(bookings: BookingRequest[], host: TourismHost): BookingRequest[] {
  const stayIds = new Set(host.stayIds);
  const experienceIds = new Set(host.experienceIds);
  return bookings.filter((booking) =>
    booking.kind === "stay" ? stayIds.has(booking.targetId) : experienceIds.has(booking.targetId),
  );
}