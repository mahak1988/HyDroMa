import type { BookingKind, BookingQuote, BookingRequest, Experience, Stay } from "@eco-nojin/domain-types";
import { hasAvailability } from "./availability";
import { nightsBetween } from "./time";
import { quoteExperience, quoteStay } from "../data/tourism";

export type StayRequestResult =
  | { ok: true; quote: BookingQuote }
  | { ok: false; reason: "invalid-dates" | "no-availability" | "too-many-guests" };

export type ExperienceRequestResult =
  | { ok: true; quote: BookingQuote }
  | { ok: false; reason: "too-many-guests" | "closed" | "invalid-dates" };

export function validateStayRequest(stay: Stay, start: string, end: string, guests: number): StayRequestResult {
  if (nightsBetween(start, end) <= 0) return { ok: false, reason: "invalid-dates" };
  if (guests <= 0) return { ok: false, reason: "too-many-guests" };
  if (guests > stay.capacity) return { ok: false, reason: "too-many-guests" };
  if (!hasAvailability(stay, start, end, guests)) return { ok: false, reason: "no-availability" };
  return { ok: true, quote: quoteStay(stay, start, end, guests) };
}

export function validateExperienceRequest(experience: Experience, guests: number): ExperienceRequestResult {
  if (experience.bookingStatus === "closed") return { ok: false, reason: "closed" };
  if (guests <= 0 || guests > experience.capacity) return { ok: false, reason: "too-many-guests" };
  return { ok: true, quote: quoteExperience(experience, guests) };
}

export function makeBooking(
  kind: BookingKind,
  targetId: string,
  start: string,
  end: string,
  guests: number,
  quote: BookingQuote,
): BookingRequest {
  const id = `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    kind,
    targetId,
    startDate: start,
    endDate: end,
    guests,
    status: "requested",
    quote: { amountMinor: quote.amountMinor, currency: quote.currency },
    createdAt: new Date().toISOString(),
    demo: true,
  };
}

export const BOOKING_STORAGE_KEY = "eco.tourism.bookings";